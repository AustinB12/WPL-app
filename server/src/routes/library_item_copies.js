import express from 'express';
import { body, validationResult } from 'express-validator';
import * as db from '../config/database.js';
import { format_sql_datetime } from '../utils.js';

const router = express.Router();

// Validation middleware
const validate_item_copy = [
  body('library_item_id')
    .isInt()
    .withMessage('Valid library item ID is required'),
  body('owning_branch_id').isInt().withMessage('Valid branch ID is required'),
  body('condition')
    .optional()
    .isIn(['New', 'Excellent', 'Good', 'Fair', 'Poor'])
    .withMessage('Invalid condition'),
  body('status')
    .optional()
    .isIn([
      'Available',
      'Checked Out',
      'Renewed Once',
      'Renewed Twice',
      'Reserved',
      'Processing',
      'Damaged',
      'Unshelved',
      'Lost',
      'Unshelved',
    ])
    .withMessage('Invalid status'),
  body('cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost must be a positive number'),
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

// GET /api/v1/item-copies - Get all item copies
router.get('/', async (req, res) => {
  try {
    const { library_item_id, branch_id, status, condition, other_status } =
      req.query;
    let conditions = '';
    const params = [];

    const filters = [];
    if (library_item_id) {
      filters.push('lic.library_item_id = ?');
      params.push(library_item_id);
    }
    if (branch_id) {
      // Filter by current_branch_id (where the copy currently is) rather than owning_branch_id
      filters.push('lic.current_branch_id = ?');
      params.push(branch_id);
    }
    if (status) {
      filters.push('lic.status = ?');
      params.push(status);
    }
    if (other_status) {
      filters.push('lic.status = ?');
      params.push(other_status);
    }
    if (condition) {
      filters.push('lic.condition = ?');
      params.push(condition);
    }

    if (filters.length > 0) {
      conditions = ` WHERE ${filters.join(' AND ')}`;
    }

    const query = `
      SELECT 
        lic.*,
        ci.title,
        ci.item_type,
        ci.publication_year,
        ci.description,
        ci.congress_code,
        b.id as current_branch_id,
        b.branch_name as current_branch_name,
        bb.id as owning_branch_id,
        bb.branch_name as owning_branch_name,
        bk.author,
        bk.publisher,
        bk.genre as book_genre,
        bk.number_of_pages,
        v.director,
        v.studio,
        v.format as video_format,
        v.duration_minutes,
        v.rating as video_rating,
        v.genre as video_genre,
        ab.narrator,
        ab.duration_in_seconds as audiobook_duration,
        ab.publisher as audiobook_publisher,
        ab.genre as audiobook_genre,
        va.artist as vinyl_artist,
        va.color as vinyl_color,
        va.number_of_tracks as vinyl_tracks,
        va.genre as vinyl_genre,
        cd.artist as cd_artist,
        cd.record_label,
        cd.number_of_tracks as cd_tracks,
        cd.genre as cd_genre,
        per.pages as periodical_pages,
        per.issue_number as periodical_issue_number,
        per.publication_date as periodical_publication_date,
        mag.subscription_cost as magazine_subscription_cost,
        mag.publisher as magazine_publisher,
        mag.issue_number as magazine_issue_number,
        mag.publication_month as magazine_publication_month,
        mag.publication_year as magazine_publication_year,
        ROW_NUMBER() OVER (PARTITION BY lic.library_item_id ORDER BY lic.id) as copy_number,
        COUNT(*) OVER (PARTITION BY lic.library_item_id) as total_copies
      FROM LIBRARY_ITEM_COPIES lic
      JOIN LIBRARY_ITEMS ci ON lic.library_item_id = ci.id
      LEFT JOIN BRANCHES b ON lic.current_branch_id = b.id
      LEFT JOIN BRANCHES bb ON lic.owning_branch_id = bb.id
      LEFT JOIN BOOKS bk ON (ci.id = bk.library_item_id AND ci.item_type = 'BOOK')
      LEFT JOIN VIDEOS v ON (ci.id = v.library_item_id AND ci.item_type = 'VIDEO')
      LEFT JOIN AUDIOBOOKS ab ON (ci.id = ab.library_item_id AND ci.item_type = 'AUDIOBOOK')
      LEFT JOIN VINYL_ALBUMS va ON (ci.id = va.library_item_id AND ci.item_type = 'VINYL_ALBUM')
      LEFT JOIN CDS cd ON (ci.id = cd.library_item_id AND ci.item_type = 'CD')
      LEFT JOIN PERIODICALS per ON (ci.id = per.library_item_id AND ci.item_type = 'PERIODICAL')
      LEFT JOIN MAGAZINES mag ON (ci.id = mag.library_item_id AND ci.item_type = 'MAGAZINE')
      ${conditions}
      ORDER BY ci.title, lic.id
    `;

    const item_copies = await db.execute_query(query, params);

    // Add copy labels using pre-calculated numbers from SQL
    const copies_with_labels = item_copies.map((copy) => ({
      ...copy,
      copy_label: `Copy ${copy.copy_number} of ${copy.total_copies}`,
    }));

    res.json({
      success: true,
      count: copies_with_labels.length,
      data: copies_with_labels,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch item copies',
      message: error.message,
    });
  }
});

// GET /api/v1/item-copies/checked-out - Get all checked out item copies, optionally filtered
router.get('/checked-out', async (req, res) => {
  try {
    const { library_item_id, branch_id, condition } = req.query;
    const params = [];

    // Initial filter on status - must be checked out
    const filters = ["lic.status = 'Checked Out'"];

    if (library_item_id) {
      filters.push('lic.library_item_id = ?');
      params.push(library_item_id);
    }
    if (branch_id) {
      // Filter by current_branch_id (where the copy currently is)
      filters.push('lic.current_branch_id = ?');
      params.push(branch_id);
    }
    if (condition) {
      filters.push('lic.condition = ?');
      params.push(condition);
    }

    const conditions = ` WHERE ${filters.join(' AND ')}`;

    const query = `
      SELECT 
        lic.*,
        ci.title,
        ci.item_type,
        ci.publication_year,
        ci.description,
        b.id as current_branch_id,
        b.branch_name as current_branch_name,
        bb.id as owning_branch_id,
        bb.branch_name as owning_branch_name,
        p.id AS patron_id,
        p.first_name AS patron_first_name,
        p.last_name AS patron_last_name,
        ROW_NUMBER() OVER (PARTITION BY lic.library_item_id ORDER BY lic.id) as copy_number,
        COUNT(*) OVER (PARTITION BY lic.library_item_id) as total_copies
      FROM LIBRARY_ITEM_COPIES lic
      JOIN LIBRARY_ITEMS ci ON lic.library_item_id = ci.id
      LEFT JOIN BRANCHES b ON lic.current_branch_id = b.id
      LEFT JOIN BRANCHES bb ON lic.owning_branch_id = bb.id
      LEFT JOIN PATRONS p ON lic.checked_out_by = p.id
      ${conditions}
      ORDER BY ci.title, lic.id
    `;

    const item_copies = await db.execute_query(query, params);

    // Add copy labels using pre-calculated numbers from SQL
    const copies_with_labels = item_copies.map((copy) => ({
      ...copy,
      copy_label: `Copy ${copy.copy_number} of ${copy.total_copies}`,
    }));

    res.json({
      success: true,
      count: copies_with_labels.length,
      data: copies_with_labels,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch checked out item copies',
      message: error.message,
    });
  }
});

// GET /api/v1/item-copies/unshelved - Get all unshelved item copies, optionally filtered by branch
router.get('/unshelved', async (req, res) => {
  try {
    const { branch_id } = req.query;

    let query;
    let params = [];

    if (branch_id) {
      query = `
        SELECT 
          ic.*,
          li.title,
          li.item_type,
          li.description,
          li.publication_year,
          b.branch_name
        FROM LIBRARY_ITEM_COPIES ic
          JOIN LIBRARY_ITEMS li ON ic.library_item_id = li.id
          LEFT JOIN BRANCHES b ON ic.current_branch_id = b.id
        WHERE ic.status = 'Unshelved' AND ic.current_branch_id = ?
        ORDER BY ic.id;
      `;
      params = [branch_id];
    } else {
      query = `
      SELECT 
          ic.*,
          li.title,
        li.item_type,
          li.description,
          li.publication_year,
        b.branch_name
        FROM LIBRARY_ITEM_COPIES ic
          JOIN LIBRARY_ITEMS li ON ic.library_item_id = li.id
          LEFT JOIN BRANCHES b ON ic.current_branch_id = b.id
        WHERE ic.status = 'Unshelved'
        ORDER BY ic.id;
      `;
      params = [];
    }

    const item_copies = await db.execute_query(query, params);

    res.json({
      success: true,
      count: item_copies.length,
      data: item_copies,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch item copies',
      message: error.message,
    });
  }
});

router.get('/recently-reshelved', async (req, res) => {
  try {
    const { branch_id } = req.query;

    if (!branch_id) {
      return res.status(400).json({
        error: 'Branch ID is required',
      });
    }

    const query = `
      SELECT 
        ic.*,
        li.title,
        li.item_type,
        li.description,
        li.publication_year,
        b.branch_name,
        p.id AS patron_id,
        p.first_name AS patron_first_name,
        p.last_name AS patron_last_name,
        t.created_at AS transaction_time
      FROM LIBRARY_ITEM_COPIES ic
        JOIN LIBRARY_ITEMS li ON ic.library_item_id = li.id
        JOIN BRANCHES b ON ic.current_branch_id = b.id
        LEFT JOIN PATRONS p ON ic.checked_out_by = p.id
        JOIN TRANSACTIONS t ON ic.id = t.copy_id
      WHERE 
        ic.status IN ('Available', 'Reserved') 
        AND UPPER(t.transaction_type) IN ('RESHELVE', 'RESERVATION PROMOTION')
        AND DATETIME(t.created_at) >= DATETIME('now', 'localtime', '-10 minutes')
        AND ic.current_branch_id = ?
      ORDER BY t.created_at DESC, b.branch_name, ic.status;
    `;
    const item_copies = await db.execute_query(query, [branch_id]);

    res.json({
      success: true,
      count: item_copies.length,
      data: item_copies,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch recently reshelved item copies',
      message: error.message,
    });
  }
});

// GET /api/v1/item-copies/item/:library_item_id - Get all copies of a library item
router.get('/item/:library_item_id', async (req, res) => {
  try {
    const { branch_id } = req.query;

    // First, get the first person in the reservation queue for this library item
    const first_reservation_query = `
      SELECT 
        r.id as reservation_id,
        r.patron_id,
        r.status as reservation_status,
        r.queue_position,
        p.first_name,
        p.last_name
      FROM RESERVATIONS r
      JOIN PATRONS p ON r.patron_id = p.id
      WHERE r.library_item_id = ?
        AND r.status IN ('ready', 'waiting')
      ORDER BY r.queue_position ASC
      LIMIT 1
    `;

    const first_reservation = await db.execute_query(first_reservation_query, [
      req.params.library_item_id,
    ]);

    const reservation_info =
      first_reservation.length > 0
        ? {
            id: first_reservation[0].reservation_id,
            patron_id: first_reservation[0].patron_id,
            patron_name:
              first_reservation[0].first_name && first_reservation[0].last_name
                ? `${first_reservation[0].first_name} ${first_reservation[0].last_name}`
                : null,
            status: first_reservation[0].reservation_status,
            queue_position: first_reservation[0].queue_position,
          }
        : null;

    // Get all copies for this library item, optionally filtered by branch
    const query = `
      SELECT 
        ic.*,
        li.title,
        li.item_type,
        li.description,
        li.publication_year,
        b.id as current_branch_id,
        b.branch_name as current_branch_name,
        bb.id as owning_branch_id,
        bb.branch_name as owning_branch_name,
        p.id AS patron_id,
        p.first_name AS patron_first_name,
        p.last_name AS patron_last_name,
        ROW_NUMBER() OVER (PARTITION BY ic.library_item_id ORDER BY ic.id) as copy_number,
        COUNT(*) OVER (PARTITION BY ic.library_item_id) as total_copies
      FROM LIBRARY_ITEM_COPIES ic
        JOIN LIBRARY_ITEMS li ON ic.library_item_id = li.id
        LEFT JOIN BRANCHES b ON ic.current_branch_id = b.id
        LEFT JOIN BRANCHES bb ON ic.owning_branch_id = bb.id
        LEFT JOIN PATRONS p ON ic.checked_out_by = p.id
      WHERE 
        ic.library_item_id = ?
        ${branch_id ? 'AND ic.current_branch_id = ?' : ''}
      ORDER BY ic.id, ic.status;
    `;
    const params = [req.params.library_item_id];

    // Filter by current_branch_id if branch_id is provided
    if (branch_id) {
      params.push(branch_id);
    }

    const item_copies = await db.execute_query(query, params);

    // Format the response to include reservation info and copy labels
    const formatted_copies = item_copies.map((copy) => {
      const result = {
        ...copy,
        copy_label: `Copy ${copy.copy_number} of ${copy.total_copies}`,
      };
      // If copy is reserved and there's a reservation, include reservation details
      if (copy.status === 'Reserved' && reservation_info) {
        result.reservation = reservation_info;
      }
      return result;
    });

    res.json({
      success: true,
      count: formatted_copies.length,
      data: formatted_copies,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch item copies',
      message: error.message,
    });
  }
});

// GET /api/v1/item-copies/:id - Get single item copy
router.get('/:id', async (req, res) => {
  try {
    const query = `
      SELECT
        lic.*,
        li.title,
        li.item_type,
        li.description,
        li.publication_year,
        b.branch_name AS owning_branch_name,
        cb.branch_name AS current_branch_name,
        COUNT(*) OVER() AS total_copies_count
      FROM LIBRARY_ITEM_COPIES lic
      JOIN LIBRARY_ITEMS li ON lic.library_item_id = li.id
      JOIN BRANCHES b ON lic.owning_branch_id = b.id
      JOIN BRANCHES cb ON lic.current_branch_id = cb.id
      WHERE lic.id = ?
    `;

    const results = await db.execute_query(query, [req.params.id]);
    const item_copy = results[0];

    if (!item_copy) {
      return res.status(404).json({
        error: 'Item copy not found',
      });
    }

    // Get all copies to calculate copy label
    const all_copies = await db.execute_query(
      'SELECT id FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ? ORDER BY id',
      [item_copy.library_item_id]
    );

    const copy_index = all_copies.findIndex((c) => c.id === item_copy.id);
    const copy_number = copy_index + 1;
    const total_copies = all_copies.length;
    const copy_label = `Copy ${copy_number} of ${total_copies}`;

    res.json({
      success: true,
      data: {
        ...item_copy,
        copy_label,
        copy_number,
        total_copies,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch item copy',
      message: error.message,
    });
  }
});

// POST /api/v1/item-copies - Create new item copy
router.post(
  '/',
  validate_item_copy,
  handle_validation_errors,
  async (req, res) => {
    try {
      // Verify library item exists
      const library_item = await db.get_by_id(
        'LIBRARY_ITEMS',
        req.body.library_item_id
      );
      if (!library_item) {
        return res.status(400).json({
          error: 'Library item not found',
        });
      }

      // Verify branch exists
      const branch = await db.get_by_id('BRANCHES', req.body.owning_branch_id);
      if (!branch) {
        return res.status(400).json({
          error: 'Branch not found',
        });
      }

      const now = format_sql_datetime(new Date());

      const item_copy_data = {
        condition: 'Good',
        status: 'Available',
        owning_branch_id: req.body.owning_branch_id, // Default location to branch
        current_branch_id: req.body.owning_branch_id,
        ...req.body,
        created_at: now,
        updated_at: now,
      };

      await db.create_record('LIBRARY_ITEM_COPIES', item_copy_data);

      res.status(201).json({
        success: true,
        message: 'Item copy created successfully',
        data: item_copy_data,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to create item copy',
        message: error.message,
      });
    }
  }
);

// Validation for updates (more lenient - only validate fields that are being updated)
const validate_item_copy_update = [
  body('library_item_id')
    .optional()
    .isInt()
    .withMessage('Valid library item ID is required'),
  body('owning_branch_id')
    .optional()
    .isInt()
    .withMessage('Valid branch ID is required'),
  body('current_branch_id')
    .optional()
    .isInt()
    .withMessage('Valid branch ID is required'),
  body('condition')
    .optional()
    .isIn(['New', 'Excellent', 'Good', 'Fair', 'Poor'])
    .withMessage('Invalid condition'),
  body('status')
    .optional()
    .isIn([
      'Available',
      'Checked Out',
      'Renewed Once',
      'Renewed Twice',
      'Reserved',
      'Processing',
      'Damaged',
      'Unshelved',
      'Lost',
      'Unshelved',
    ])
    .withMessage('Invalid status'),
  body('cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost must be a positive number'),
];

// PUT /api/v1/item-copies/:id - Update item copy
router.put(
  '/:id',
  validate_item_copy_update,
  handle_validation_errors,
  async (req, res) => {
    try {
      const existing_copy = await db.get_by_id(
        'LIBRARY_ITEM_COPIES',
        req.params.id
      );

      if (!existing_copy) {
        return res.status(404).json({
          error: 'Item copy not found',
        });
      }

      const update_data = {
        ...req.body,
        updated_at: format_sql_datetime(new Date()),
      };

      const updated = await db.update_record(
        'LIBRARY_ITEM_COPIES',
        req.params.id,
        update_data
      );

      if (updated) {
        res.json({
          success: true,
          message: 'Item copy updated successfully',
        });
      } else {
        res.status(500).json({
          error: 'Failed to update item copy',
        });
      }
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update item copy',
        message: error.message,
      });
    }
  }
);

// DELETE /api/v1/item-copies/:id - Delete item copy
router.delete('/:id', async (req, res) => {
  try {
    const existing_copy = await db.get_by_id(
      'LIBRARY_ITEM_COPIES',
      req.params.id
    );

    if (!existing_copy) {
      return res.status(404).json({
        error: 'Item copy not found',
      });
    }

    // Check if copy is currently checked out
    if (existing_copy.status === 'Checked Out') {
      return res.status(400).json({
        error: 'Cannot delete item copy that is currently checked out',
      });
    }

    const deleted = await db.delete_record(
      'LIBRARY_ITEM_COPIES',
      req.params.id
    );

    if (deleted) {
      res.json({
        success: true,
        message: 'Item copy deleted successfully',
      });
    } else {
      res.status(500).json({
        error: 'Failed to delete item copy',
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete item copy',
      message: error.message,
    });
  }
});

export default router;
