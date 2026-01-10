import express from 'express';
import { body, validationResult } from 'express-validator';
import pico from 'picocolors';
import * as db from '../config/database.js';
import { queue_reservation_ready } from '../services/emailService.js';
import { format_sql_datetime } from '../utils.js';

const router = express.Router();

// Helper function to check and process expired reservations
const process_expired_reservations = async () => {
  const now = format_sql_datetime(new Date());
  try {
    // Find all "ready" reservations that have expired (more than 5 days old)
    const expired_reservations = await db.execute_query(
      'SELECT id, item_copy_id FROM RESERVATIONS WHERE status = "ready" AND expiry_date < ?',
      [now]
    );

    if (expired_reservations.length > 0) {
      const reservation_ids = expired_reservations.map((r) => r.id);
      const copy_ids = expired_reservations.map((r) => r.item_copy_id);

      // Use parameterized queries with placeholders for safety
      const reservation_placeholders = reservation_ids
        .map(() => '?')
        .join(', ');
      const copy_placeholders = copy_ids.map(() => '?').join(', ');

      await db.execute_query(
        `UPDATE RESERVATIONS SET status = 'expired', updated_at = ? WHERE id IN (${reservation_placeholders})`,
        [now, ...reservation_ids]
      );

      await db.execute_query(
        `UPDATE LIBRARY_ITEM_COPIES SET status = 'Unshelved', updated_at = ? WHERE id IN (${copy_placeholders})`,
        [now, ...copy_ids]
      );
    }
    console.log(
      pico.bgGreen(
        pico.bold(
          `Expired reservations processed | Count: ${expired_reservations.length}`
        )
      )
    );
  } catch (error) {
    console.error('Error processing expired reservations:', error);
  }
};

// Validation middleware
const validate_reservation = [
  body('item_copy_id')
    .isInt({ min: 1 })
    .withMessage('Valid item copy ID is required'),
  body('patron_id')
    .isInt({ min: 1 })
    .withMessage('Valid patron ID is required'),
];

// Helper function to handle validation errors
const handle_validation_errors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// GET /api/v1/reservations - Get all reservations
router.get('/', async (req, res) => {
  try {
    // Process expired reservations before fetching
    await process_expired_reservations();

    const { patron_id, status, item_copy_id } = req.query;
    let conditions = '';
    const params = [];

    const filters = [];
    if (patron_id) {
      filters.push('r.patron_id = ?');
      params.push(patron_id);
    }
    if (status) {
      filters.push('r.status = ?');
      params.push(status);
    }
    if (item_copy_id) {
      filters.push('r.item_copy_id = ?');
      params.push(item_copy_id);
    }
    if (filters.length > 0) {
      conditions = ` WHERE ${filters.join(' AND ')}`;
    }

    const query = `
      SELECT 
        r.*,
        p.first_name,
        p.last_name,
        p.email,
		p.image_url as patron_image,
        li.title,
        li.item_type,
        li.description,
        ic.status as copy_status,
        ic.condition as copy_condition
      FROM RESERVATIONS r
      JOIN PATRONS p ON r.patron_id = p.id
      JOIN LIBRARY_ITEM_COPIES ic ON r.item_copy_id = ic.id
      JOIN LIBRARY_ITEMS li ON ic.library_item_id = li.id
      ${conditions}
      ORDER BY r.queue_position, r.reservation_date
    `;

    const reservations = await db.execute_query(query, params);

    res.json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch reservations',
      message: error.message,
    });
  }
});

// GET /api/v1/reservations/:id - Get single reservation
router.get('/:id', async (req, res) => {
  try {
    const query = `
      SELECT 
        r.*,
        p.first_name,
        p.last_name,
        p.email,
		p.image_url as patron_image,
        li.title,
        li.item_type,
        li.description,
        ic.id as copy_id,
        ic.status as copy_status,
        ic.condition as copy_condition
      FROM RESERVATIONS r
      JOIN PATRONS p ON r.patron_id = p.id
      JOIN LIBRARY_ITEM_COPIES ic ON r.item_copy_id = ic.id
      JOIN LIBRARY_ITEMS li ON ic.library_item_id = li.id
      WHERE r.id = ?
    `;

    const results = await db.execute_query(query, [req.params.id]);
    const reservation = results[0];

    if (!reservation) {
      return res.status(404).json({
        error: 'Reservation not found',
      });
    }

    res.json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch reservation',
      message: error.message,
    });
  }
});

// GET /api/v1/reservations/item-copy/:item_copy_id - Get all reservations for a specific item copy
router.get('/item-copy/:item_copy_id', async (req, res) => {
  try {
    const { item_copy_id } = req.params;

    const query = `
      SELECT 
        r.*,
        p.first_name,
        p.last_name,
        p.email,
		p.image_url as patron_image,
        p.phone,
        li.title,
        li.item_type,
        li.description,
        ic.status as copy_status,
        ic.condition as copy_condition
      FROM RESERVATIONS r
      JOIN PATRONS p ON r.patron_id = p.id
      JOIN LIBRARY_ITEM_COPIES ic ON r.item_copy_id = ic.id
      JOIN LIBRARY_ITEMS li ON ic.library_item_id = li.id
      WHERE r.item_copy_id = ?
      ORDER BY r.queue_position ASC, r.reservation_date ASC
    `;

    const reservations = await db.execute_query(query, [item_copy_id]);

    res.json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch reservations for item copy',
      message: error.message,
    });
  }
});

// POST /api/v1/reservations - Create new reservation
router.post(
  '/',
  validate_reservation,
  handle_validation_errors,
  async (req, res) => {
    try {
      const { item_copy_id, patron_id } = req.body;

      // Lookup patron record
      const patron = await db.get_by_id('PATRONS', patron_id);

      // Validate patron account
      if (!patron) {
        return res.status(400).json({
          error: 'Return validation failure',
          message: 'Patron not found',
          validation_failed: true,
        });
      }

      if (!patron.is_active) {
        return res.status(400).json({
          error: 'Return validation failure',
          message: 'Patron account is not active',
          validation_failed: true,
        });
      }

      // Verify library item exists
      const copy = await db.get_by_id('LIBRARY_ITEM_COPIES', item_copy_id);
      if (!copy) {
        return res.status(400).json({
          error: 'Library item copy not found',
        });
      }

      const reservable_statuses = ['Available', 'Checked Out', 'Unshelved'];
      if (!reservable_statuses.includes(copy.status)) {
        return res.status(400).json({
          error: 'Copy not reservable',
          message: `Copy ID ${item_copy_id} has status "${copy.status}" and cannot be reserved`,
          validation_failed: true,
        });
      }

      // Step 9-10: Check if item is already reserved by this patron
      const existing_patron_reservation = await db.execute_query(
        'SELECT id FROM RESERVATIONS WHERE item_copy_id = ? AND patron_id = ? AND status IN ("waiting", "ready")',
        [item_copy_id, patron_id]
      );

      if (existing_patron_reservation.length > 0) {
        return res.status(400).json({
          error: 'Item already reserved',
          message: 'Patron already has a reservation for this item',
          already_reserved: true,
        });
      }

      // Get existing reservations count for this copy
      const existing_reservations = await db.execute_query(
        'SELECT COUNT(*) as count FROM RESERVATIONS WHERE item_copy_id = ? AND status IN ("waiting", "ready")',
        [item_copy_id]
      );

      const existing_count = existing_reservations[0].count;

      // Get next queue position
      const queue_position_result = await db.execute_query(
        'SELECT COALESCE(MAX(queue_position), 0) + 1 as next_position FROM RESERVATIONS WHERE item_copy_id = ? AND status IN ("waiting", "ready")',
        [item_copy_id]
      );

      const queue_position = queue_position_result[0].next_position;

      // Determine reservation status:
      // - If copy is Available AND no other reservations exist, mark as "ready"
      // - Otherwise, mark as "waiting" (copy is checked out, unshelved, or already has other reservations)
      const reservation_status =
        copy.status === 'Available' && existing_count === 0
          ? 'ready'
          : 'waiting';

      const now = format_sql_datetime(new Date());

      // Set expiry date to 5 days from now (only applies when status is "ready")
      const reservation_date = new Date();
      const expiry_date = new Date(reservation_date);
      expiry_date.setDate(expiry_date.getDate() + 5);

      const reservation_data = {
        item_copy_id: copy.id,
        patron_id,
        reservation_date: format_sql_datetime(reservation_date),
        expiry_date: format_sql_datetime(expiry_date),
        status: reservation_status,
        queue_position,
        created_at: now,
        updated_at: now,
      };

      // Wrap all database operations in a transaction for atomicity
      await db.execute_transaction(async () => {
        // Create reservation record
        const reservation_id = await db.create_record(
          'RESERVATIONS',
          reservation_data
        );

        // Update copy status to Reserved only if reservation is ready
        if (reservation_status === 'ready') {
          await db.update_record('LIBRARY_ITEM_COPIES', item_copy_id, {
            status: 'Reserved',
            updated_at: now,
          });
        }

        // Response varies based on reservation status
        res.status(201).json({
          success: true,
          message:
            reservation_status === 'ready'
              ? 'Reservation ready for pickup'
              : `Added to waitlist at position ${queue_position}`,
          data: {
            item_copy_id: reservation_data.item_copy_id,
            reservation_details: {
              reservation_id: reservation_id,
              reservation_date: reservation_data.reservation_date,
              expiry_date: reservation_data.expiry_date,
              status: reservation_data.status,
              queue_position: reservation_data.queue_position,
            },
            patron_details: {
              first_name: patron.first_name,
              last_name: patron.last_name,
              email: patron.email,
            },
          },
          on_waitlist: reservation_status === 'waiting',
          queue_position,
        });
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to create reservation',
        message: error.message,
      });
    }
  }
);

// PUT /api/v1/reservations/:id/fulfill - Fulfill reservation when item is returned
// Sets 5-day expiry from the fulfillment date
router.put('/:id/fulfill', async (req, res) => {
  try {
    const reservation = await db.get_by_id('RESERVATIONS', req.params.id);

    if (!reservation) {
      return res.status(404).json({
        error: 'Reservation not found',
      });
    }

    if (reservation.status !== 'waiting' && reservation.status !== 'ready') {
      return res.status(400).json({
        error: 'Only waiting or ready reservations can be fulfilled',
      });
    }

    // Check if item is available
    const available_copies = await db.execute_query(
      'SELECT * FROM LIBRARY_ITEM_COPIES WHERE id = ? AND status = "Available" LIMIT 1',
      [reservation.item_copy_id]
    );

    if (available_copies.length === 0) {
      return res.status(400).json({
        error: 'No available copies to fulfill reservation',
      });
    }

    // Calculate expiry date: 5 days from now (when item becomes available)
    const expiry_date = new Date();
    expiry_date.setDate(expiry_date.getDate() + 5);

    const now = format_sql_datetime(new Date());

    // Wrap all operations in a transaction for atomicity
    await db.execute_transaction(async () => {
      // Update reservation status to 'ready' and set expiry date
      await db.update_record('RESERVATIONS', req.params.id, {
        status: 'ready',
        expiry_date: format_sql_datetime(expiry_date),
        notification_sent: now,
        updated_at: now,
      });

      // Reserve the item copy
      await db.update_record('LIBRARY_ITEM_COPIES', available_copies[0].id, {
        status: 'Reserved',
        updated_at: now,
      });

      // Update queue positions for remaining reservations
      await db.execute_query(
        'UPDATE RESERVATIONS SET queue_position = queue_position - 1 WHERE item_copy_id = ? AND queue_position > ? AND status = "waiting"',
        [reservation.item_copy_id, reservation.queue_position]
      );
    });

    // Queue reservation ready email
    try {
      const patron = await db.get_by_id('PATRONS', reservation.patron_id);
      const item_copy = await db.get_by_id(
        'LIBRARY_ITEM_COPIES',
        available_copies[0].id
      );
      const library_item = await db.get_by_id(
        'LIBRARY_ITEMS',
        item_copy.library_item_id
      );

      if (patron?.email && library_item) {
        await queue_reservation_ready(
          patron,
          {
            id: item_copy.id,
            title: library_item.title,
            item_type: library_item.item_type,
          },
          { expiry_date: format_sql_datetime(expiry_date) }
        );
      }
    } catch (email_error) {
      console.error('Failed to queue reservation ready email:', email_error);
      // Don't fail the fulfillment if email queueing fails
    }

    res.json({
      success: true,
      message:
        'Reservation fulfilled successfully - patron has 5 days to collect',
      data: {
        reservation_id: req.params.id,
        copy_id: available_copies[0].id,
        expiry_date: format_sql_datetime(expiry_date),
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fulfill reservation',
      message: error.message,
    });
  }
});

// GET /api/v1/reservations/validate-patron/:patron_id - Validate patron for reservation
// Used by UI to lookup and display patron details before creating reservation
router.get('/validate-patron/:patron_id', async (req, res) => {
  try {
    const patron = await db.get_by_id('PATRONS', req.params.patron_id);

    if (!patron) {
      return res.status(404).json({
        error: 'Patron not found',
        valid: false,
      });
    }

    // Check if patron is active
    if (!patron.is_active) {
      return res.status(400).json({
        error: 'Patron account is not active',
        valid: false,
        patron: {
          first_name: patron.first_name,
          last_name: patron.last_name,
          email: patron.email,
          is_active: patron.is_active,
        },
      });
    }

    res.json({
      success: true,
      valid: true,
      patron: {
        id: patron.id,
        first_name: patron.first_name,
        last_name: patron.last_name,
        email: patron.email,
        phone: patron.phone,
        address: patron.address,
        card_expiration_date: patron.card_expiration_date,
        is_active: patron.is_active,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to validate patron',
      message: error.message,
    });
  }
});

// PUT /api/v1/reservations/expire-old - Expire reservations older than 5 days
// Should be called periodically (e.g., daily cron job)
router.put('/expire-old', async (_, res) => {
  try {
    const today = format_sql_datetime(new Date());

    // Find all ready reservations that have expired
    const expired_reservations = await db.execute_query(
      'SELECT * FROM RESERVATIONS WHERE status = "ready" AND expiry_date < ?',
      [today]
    );

    let expired_count = 0;

    // Wrap all expiration operations in a transaction
    await db.execute_transaction(async () => {
      for (const reservation of expired_reservations) {
        // Update reservation status to expired
        await db.update_record('RESERVATIONS', reservation.id, {
          status: 'expired',
          updated_at: today,
        });

        // Get the reserved copy and make it available again
        const reserved_copies = await db.execute_query(
          'SELECT * FROM LIBRARY_ITEM_COPIES WHERE id = ? AND status = "Reserved" LIMIT 1',
          [reservation.item_copy_id]
        );

        if (reserved_copies.length > 0) {
          await db.update_record('LIBRARY_ITEM_COPIES', reserved_copies[0].id, {
            status: 'Available',
            updated_at: today,
          });
        }

        expired_count++;
      }
    });

    res.json({
      success: true,
      message: `${expired_count} reservation(s) expired`,
      expired_count,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to expire reservations',
      message: error.message,
    });
  }
});

// DELETE /api/v1/reservations/:id - Cancel reservation
router.delete('/:id', async (req, res) => {
  const now = format_sql_datetime(new Date());
  try {
    const reservation = await db.get_by_id('RESERVATIONS', req.params.id);

    if (!reservation) {
      return res.status(404).json({
        error: 'Reservation not found',
      });
    }

    if (reservation.status !== 'waiting' && reservation.status !== 'ready') {
      return res.status(400).json({
        error: 'Only waiting or ready reservations can be cancelled',
      });
    }

    // Wrap all cancellation operations in a transaction
    await db.execute_transaction(async () => {
      // Update reservation status to cancelled
      await db.update_record('RESERVATIONS', req.params.id, {
        status: 'cancelled',
        updated_at: now,
      });

      // If there was a reserved copy, we need to handle it carefully
      if (reservation.status === 'ready') {
        const reserved_copies = await db.execute_query(
          'SELECT * FROM LIBRARY_ITEM_COPIES WHERE id = ? AND status = "Reserved"',
          [reservation.item_copy_id]
        );

        // Check if there are waiting reservations that should be promoted
        const next_waiting_reservations = await db.execute_query(
          'SELECT * FROM RESERVATIONS WHERE item_copy_id = ? AND status = "waiting" ORDER BY queue_position LIMIT 1',
          [reservation.item_copy_id]
        );

        if (
          next_waiting_reservations.length > 0 &&
          reserved_copies.length > 0
        ) {
          // CRITICAL: Promote the next waiting reservation to "ready" status
          // This ensures queue position #1 is always "ready", never "waiting"
          const next_reservation = next_waiting_reservations[0];
          const new_expiry = new Date();
          new_expiry.setDate(new_expiry.getDate() + 5);

          await db.update_record('RESERVATIONS', next_reservation.id, {
            status: 'ready',
            expiry_date: format_sql_datetime(new_expiry),
            updated_at: now,
          });

          // Keep the copy as "Reserved" for the promoted reservation
          // (no need to change copy status since it was already Reserved)
        } else if (reserved_copies.length > 0) {
          // No waiting reservations, so make the copy available
          await db.update_record('LIBRARY_ITEM_COPIES', reserved_copies[0].id, {
            status: 'Available',
            updated_at: now,
          });
        }
      }

      // Update queue positions for remaining reservations
      await db.execute_query(
        'UPDATE RESERVATIONS SET queue_position = queue_position - 1 WHERE item_copy_id = ? AND queue_position > ? AND status IN ("waiting", "ready")',
        [reservation.item_copy_id, reservation.queue_position]
      );
    });

    res.json({
      success: true,
      message: 'Reservation cancelled successfully',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to cancel reservation',
      message: error.message,
    });
  }
});

export default router;
