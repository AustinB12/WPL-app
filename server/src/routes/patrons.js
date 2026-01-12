import express from 'express';
import { body, validationResult } from 'express-validator';
import * as db from '../config/database.js';
import { format_sql_datetime, format_sql_date } from '../utils.js';

const router = express.Router();

// Validation middleware
const validate_patron = [
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phone').optional().isString().withMessage('Phone must be a string'),
  body('balance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Balance must be a non-negative number'),
  body('local_branch_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Branch ID must be a valid positive integer'),
  body('card_expiration_date')
    .optional()
    .isString()
    .withMessage('Card expiration date must be a valid date (YYYY-MM-DD)'),
  body('birthday')
    .optional()
    .isString()
    .withMessage('Birthday must be a valid date (YYYY-MM-DD)'),
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

// GET /api/v1/patrons - Get all patrons
router.get('/', async (req, res) => {
  try {
    const { search, active_only } = req.query;
    const conditions = [];
    const params = [];

    if (active_only === 'true') {
      conditions.push('p.is_active = 1');
    }

    if (search) {
      conditions.push(
        '(p.first_name LIKE ? OR p.last_name LIKE ? OR p.email LIKE ?)'
      );
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const where_clause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Include active checkout count for each patron
    const patrons = await db.execute_query(
      `SELECT
        p.*,
        b.branch_name as local_branch_name,
        COUNT(CASE WHEN lic.checked_out_by = p.id THEN 1 END) as active_checkouts
      FROM PATRONS p
      LEFT JOIN LIBRARY_ITEM_COPIES lic ON p.id = lic.checked_out_by
      JOIN BRANCHES b ON p.local_branch_id = b.id
      ${where_clause}
      GROUP BY p.id
      ORDER BY p.last_name, p.first_name`,
      params
    );
    res.json({
      success: true,
      count: patrons.length,
      data: patrons,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch patrons',
      message: error.message,
    });
  }
});

// GET /api/v1/patrons/search-for-renewal - Search patron by ID or name and get checked-out items
router.get('/search-for-renewal', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        error: 'Search query is required',
      });
    }

    // Search for patron by ID or name
    let patron = null;

    // Try to parse as ID first
    const patron_id = parseInt(query, 10);
    if (!Number.isNaN(patron_id)) {
      patron = await db.get_by_id('PATRONS', patron_id);
    }

    // If not found by ID, search by name
    if (!patron) {
      const patrons = await db.execute_query(
        `SELECT * FROM PATRONS
         WHERE LOWER(first_name || ' ' || last_name) = LOWER(?)
         OR LOWER(first_name) = LOWER(?)
         OR LOWER(last_name) = LOWER(?)
         LIMIT 1`,
        [query, query, query]
      );

      if (patrons.length > 0) {
        patron = patrons[0];
      }
    }

    if (!patron) {
      return res.status(404).json({
        error: 'Patron not found',
      });
    }

    // Get all active checked-out items for this patron
    const checked_out_items = await db.execute_query(
      `SELECT
        t.id as transaction_id,
        t.item_copy_id,
        t.date,
        li.id as library_item_id,
        li.title,
        li.item_type,
        b.author,
        v.director,
        (SELECT COUNT(*) FROM RESERVATIONS r
         WHERE r.item_copy_id = ic.id
         AND r.status IN ('waiting', 'ready')) as has_reservations
       FROM ITEM_TRANSACTIONS t
       JOIN LIBRARY_ITEM_COPIES ic ON t.item_copy_id = ic.id
       JOIN LIBRARY_ITEMS li ON ic.library_item_id = li.id
       LEFT JOIN BOOKS b ON li.id = b.library_item_id
       LEFT JOIN VIDEOS v ON li.id = v.library_item_id
       WHERE t.patron_id = ?
       ORDER BY t.date ASC`,
      [patron.id]
    );

    // Get active checkout count
    const active_checkout_count = await db.execute_query(
      'SELECT COUNT(*) as count FROM ITEM_TRANSACTIONS WHERE patron_id = ? ',
      [patron.id]
    );

    res.json({
      success: true,
      data: {
        patron: {
          id: patron.id,
          first_name: patron.first_name,
          last_name: patron.last_name,
          card_expiration_date: patron.card_expiration_date,
          balance: patron.balance,
          active_checkout_count: active_checkout_count[0].count,
        },
        checked_out_items: checked_out_items.map((item) => ({
          transaction_id: item.transaction_id,
          copy_id: item.item_copy_id,
          library_item_id: item.library_item_id,
          title: item.title,
          item_type: item.item_type,
          author: item.author,
          director: item.director,
          renewal_status: item.renewal_status,
          has_reservations: item.has_reservations > 0,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to search patron',
      message: error.message,
    });
  }
});

// GET /api/v1/patrons/:id - Get single patron
router.get('/:id', async (req, res) => {
  try {
    const [patron] = await db.execute_query(
      `SELECT
        p.*,
        b.id as local_branch_id,
        b.branch_name as local_branch_name,
        COUNT(CASE WHEN lic.checked_out_by = p.id THEN 1 END) as active_checkouts
      FROM PATRONS p
      LEFT JOIN LIBRARY_ITEM_COPIES lic ON p.id = lic.checked_out_by
      JOIN BRANCHES b ON p.local_branch_id = b.id
      WHERE p.id = ?
      GROUP BY p.id`,
      [req.params.id]
    );

    if (!patron) {
      return res.status(404).json({
        error: 'Patron not found',
      });
    }

    res.json({
      success: true,
      data: patron,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch patron',
      message: error.message,
    });
  }
});

// GET /api/v1/patrons/:id/transactions - Get patron's transaction history
router.get('/:id/transactions', async (req, res) => {
  try {
    const patron = await db.get_by_id('PATRONS', req.params.id);

    if (!patron) {
      return res.status(404).json({
        error: 'Patron not found',
      });
    }

    const transactions = await db.execute_query(
      `SELECT 
        t.*, 
        ci.title, 
        ci.item_type, 
        ic.library_item_id,
        (
          SELECT COUNT(*) + 1
          FROM LIBRARY_ITEM_COPIES ic2
          WHERE ic2.library_item_id = ic.library_item_id
          AND ic2.id < ic.id
        ) as copy_number,
        (
          SELECT COUNT(*)
          FROM LIBRARY_ITEM_COPIES ic3
          WHERE ic3.library_item_id = ic.library_item_id
        ) as total_copies
       FROM ITEM_TRANSACTIONS t
       JOIN LIBRARY_ITEM_COPIES ic ON t.item_copy_id = ic.id
       JOIN LIBRARY_ITEMS ci ON ic.library_item_id = ci.id
       WHERE t.patron_id = ?
       ORDER BY t.created_at DESC`,
      [req.params.id]
    );

    // Add copy labels to transactions
    const transactions_with_labels = transactions.map((transaction) => ({
      ...transaction,
      copy_label: `Copy ${transaction.copy_number} of ${transaction.total_copies}`,
    }));

    res.json({
      success: true,
      count: transactions_with_labels.length,
      data: transactions_with_labels,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch patron transactions',
      message: error.message,
    });
  }
});

// POST /api/v1/patrons - Create new patron
router.post(
  '/',
  validate_patron,
  handle_validation_errors,
  async (req, res) => {
    try {
      // Validate branch exists if provided
      if (req.body.local_branch_id) {
        const branch = await db.get_by_id('BRANCHES', req.body.local_branch_id);
        if (!branch) {
          return res.status(400).json({
            error: 'Invalid branch ID',
            message: `Branch with ID ${req.body.local_branch_id} does not exist`,
          });
        }
      }

      const patron_data = {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email || null,
        phone: req.body.phone || null,
        address: req.body.address || null,
        image_url: req.body.image_url || null,
        birthday: req.body.birthday ? format_sql_date(req.body.birthday) : null,
        local_branch_id: req.body.local_branch_id || 1,
        card_expiration_date: req.body.card_expiration_date
          ? format_sql_date(req.body.card_expiration_date)
          : null,
        balance: req.body.balance || 0.0,
        is_active: true,
        created_at: format_sql_datetime(new Date()),
      };

      const patron_id = await db.create_record('PATRONS', patron_data);

      res.status(201).json({
        success: true,
        message: 'Patron created successfully',
        data: { id: patron_id, ...patron_data },
      });
    } catch (error) {
      // Handle SQLite unique constraint violations
      if (error.message?.includes('UNIQUE constraint failed')) {
        return res.status(409).json({
          error: 'Duplicate entry',
          message: 'A patron with this email already exists',
        });
      }

      res.status(500).json({
        error: 'Failed to create patron',
        message: error.message,
      });
    }
  }
);

// PUT /api/v1/patrons/:id - Update patron
router.put(
  '/:id',
  validate_patron,
  handle_validation_errors,
  async (req, res) => {
    try {
      const existing_patron = await db.get_by_id('PATRONS', req.params.id);

      if (!existing_patron) {
        return res.status(404).json({
          error: 'Patron not found',
        });
      }

      // Validate branch exists if provided
      if (req.body.local_branch_id) {
        const branch = await db.get_by_id('BRANCHES', req.body.local_branch_id);
        if (!branch) {
          return res.status(400).json({
            error: 'Invalid branch ID',
            message: `Branch with ID ${req.body.local_branch_id} does not exist`,
          });
        }
      }

      // Check if email already exists for a different patron
      if (req.body.email && req.body.email !== existing_patron.email) {
        const email_check = await db.execute_query(
          'SELECT id FROM PATRONS WHERE email = ? AND id != ?',
          [req.body.email, req.params.id]
        );
        if (email_check.length > 0) {
          return res.status(409).json({
            error: 'Email already exists',
            message: 'A patron with this email address already exists',
          });
        }
      }

      await db.update_record('PATRONS', req.params.id, req.body);

      // Fetch and return the updated patron data
      const updated_patron = await db.get_by_id('PATRONS', req.params.id);
      res.json({
        success: true,
        data: updated_patron,
        message: 'Patron updated successfully',
      });
    } catch (error) {
      // Handle SQLite unique constraint violations
      if (error.message?.includes('UNIQUE constraint failed')) {
        return res.status(409).json({
          error: 'Duplicate entry',
          message: 'A patron with this email already exists',
        });
      }

      res.status(500).json({
        error: 'Failed to update patron',
        message: error.message,
      });
    }
  }
);

// DELETE /api/v1/patrons/:id - Delete patron
router.delete('/:id', async (req, res) => {
  try {
    const existing_patron = await db.get_by_id('PATRONS', req.params.id);

    if (!existing_patron) {
      return res.status(404).json({
        error: 'Patron not found',
      });
    }

    // Database has ON DELETE CASCADE for FINES, ITEM_TRANSACTIONS, and RESERVATIONS
    // So we only need to delete the patron record
    await db.delete_record('PATRONS', req.params.id);

    res.json({
      success: true,
      message: 'Patron deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete patron',
      message: error.message,
    });
  }
});

export default router;
