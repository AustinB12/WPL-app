import express from 'express';
import { body, validationResult } from 'express-validator';
import * as db from '../config/database.js';

const router = express.Router();

const validate_checkout = [
  body('patron_id')
    .isInt({ min: 1 })
    .withMessage('Valid patron ID is required'),
  body('copy_id').isInt({ min: 1 }).withMessage('Valid copy ID is required'),
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid due date format'),
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

// PUT /api/v1/reshelve - Mark item copies as reshelved
router.put('/reshelve', async (req, res) => {
  try {
    const { copy_ids } = req.body;
    if (!copy_ids || !Array.isArray(copy_ids)) {
      return res.status(400).json({
        error: 'copy_ids must be provided as an array',
      });
    }
    await db.execute_transaction(async () => {
      for (const copy_id of copy_ids) {
        const item_copy = await db.get_by_id('LIBRARY_ITEM_COPIES', copy_id);
        if (!item_copy) {
          throw new Error(`Item copy with ID ${copy_id} not found`);
        }

        // Validate item is in Unshelved status before reshelving
        if (item_copy.status !== 'Unshelved') {
          throw new Error(
            `Item copy with ID ${copy_id} cannot be reshelved. Current status: ${item_copy.status}`
          );
        }

        await db.update_record('LIBRARY_ITEM_COPIES', item_copy.id, {
          status: 'Available',
          updated_at: new Date().toISOString(),
        });

        const now = new Date().toISOString();

        const reshelve_transaction_data = {
          copy_id: item_copy.id,
          location_id: item_copy.current_branch_id,
          transaction_type: 'reshelve',
          created_at: now,
          updated_at: now,
          status: 'Completed',
        };

        await db.create_record('TRANSACTIONS', reshelve_transaction_data);
      }
    });

    res.json({
      success: true,
      message: 'Item copies reshelved successfully',
      data: {
        reshelved_count: copy_ids.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to reshelve item copies',
      message: error.message,
    });
  }
});

// GET /api/v1/transactions - Get all transactions
router.get('/', async (req, res) => {
  try {
    const { patron_id, status, transaction_type, order_by } = req.query;
    let conditions = '';
    let params = [];

    const filters = [];
    if (patron_id) {
      filters.push('t.patron_id = ?');
      params.push(patron_id);
    }
    if (status) {
      filters.push('t.status = ?');
      params.push(status);
    }
    if (transaction_type) {
      filters.push('t.transaction_type = ?');
      params.push(transaction_type);
    }

    if (filters.length > 0) {
      conditions = ' WHERE ' + filters.join(' AND ');
    }

    const query = `
      SELECT 
        t.*,
        p.first_name,
        p.last_name,
        ci.title,
        ci.item_type,
        ic.condition,
        b.branch_name
      FROM TRANSACTIONS t
      LEFT JOIN PATRONS p ON t.patron_id = p.id
      JOIN LIBRARY_ITEM_COPIES ic ON t.copy_id = ic.id
      JOIN LIBRARY_ITEMS ci ON ic.library_item_id = ci.id
      JOIN BRANCHES b ON ic.owning_branch_id = b.id
      ${conditions}
      ORDER BY ${order_by || 't.created_at'} DESC
    `;

    const transactions = await db.execute_query(query, params);

    res.json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch transactions',
      message: error.message,
    });
  }
});

// GET /api/v1/transactions/:id - Get single transaction
router.get('/:id', async (req, res) => {
  try {
    const query = `
      SELECT 
        t.*,
        p.first_name,
        p.last_name,
        p.email,
        ci.title,
        ci.item_type,
        b.branch_name
      FROM TRANSACTIONS t
      JOIN PATRONS p ON t.patron_id = p.id
      JOIN LIBRARY_ITEM_COPIES ic ON t.copy_id = ic.id
      JOIN LIBRARY_ITEMS ci ON ic.library_item_id = ci.id
      JOIN BRANCHES b ON ic.owning_branch_id = b.id
      WHERE t.id = ?
    `;

    const results = await db.execute_query(query, [req.params.id]);
    const transaction = results[0];

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found',
      });
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch transaction',
      message: error.message,
    });
  }
});

// GET /api/v1/transactions/patron/:patron_id - Get all transactions for a patron
router.get('/patron/:patron_id', async (req, res) => {
  try {
    const query = `
      SELECT 
        t.*,
        p.first_name,
        p.last_name,
        ci.title,
        ci.item_type,
        ic.condition,
        b.branch_name
      FROM TRANSACTIONS t
      JOIN PATRONS p ON t.patron_id = p.id
      JOIN LIBRARY_ITEM_COPIES ic ON t.copy_id = ic.id
      JOIN LIBRARY_ITEMS ci ON ic.library_item_id = ci.id
      JOIN BRANCHES b ON ic.owning_branch_id = b.id
      WHERE t.patron_id = ?
    `;

    const results = await db.execute_query(query, [req.params.patron_id]);
    res.json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch transactions',
      message: error.message,
    });
  }
});

// POST /api/v1/transactions/checkout - Checkout item
router.post(
  '/checkout',
  validate_checkout,
  handle_validation_errors,
  async (req, res) => {
    try {
      const { copy_id, patron_id } = req.body;

      // Verify item copy exists and is available
      const item_copy = await db.get_by_id('LIBRARY_ITEM_COPIES', copy_id);
      if (!item_copy) {
        return res.status(400).json({
          error: 'Item copy not found',
        });
      }

      if (item_copy.status !== 'Available') {
        return res.status(400).json({
          error: 'Item is not available for checkout',
          current_status: item_copy.status,
        });
      }

      // Verify patron exists and is active
      const patron = await db.get_by_id('PATRONS', patron_id);
      if (!patron || !patron.is_active) {
        return res.status(400).json({
          error: 'Patron not found or inactive',
        });
      }

      const library_item = await db.get_by_id(
        'LIBRARY_ITEMS',
        item_copy.library_item_id
      );

      const this_year = new Date().getFullYear();

      // Calculate due date if not provided (default 14 days)
      const checkout_date = new Date();
      const calculated_due_date =
        library_item.item_type === 'VIDEO'
          ? library_item.publication_year >= this_year - 1
            ? new Date(checkout_date.getTime() + 3 * 24 * 60 * 60 * 1000)
            : new Date(checkout_date.getTime() + 14 * 24 * 60 * 60 * 1000) // 1 week for new VIDEO, else 2 weeks
          : new Date(checkout_date.getTime() + 28 * 24 * 60 * 60 * 1000); // 4 weeks for BOOK and others

      const now = new Date().toISOString();

      // Create transaction
      const transaction_data = {
        copy_id,
        patron_id,
        location_id: item_copy.current_branch_id,
        transaction_type: 'checkout',
        checkout_date: checkout_date.toISOString(),
        due_date: calculated_due_date.toISOString(),
        status: 'Active',
        fine_amount: 0,
        created_at: now,
        updated_at: now,
      };

      await db.create_record('transactions', transaction_data);

      // Update item copy status and checkout info
      await db.update_record('LIBRARY_ITEM_COPIES', copy_id, {
        status: 'Checked Out',
        checked_out_by: patron_id,
        due_date: calculated_due_date.toISOString(),
        updated_at: now,
      });

      // Fetch enriched data for receipt
      const query = `
        SELECT
          t.*,
          p.first_name,
          p.last_name,
          li.title,
          li.item_type,
          li.publication_year,
          b.author,
          b.publisher,
          v.director,
          v.studio,
          v.is_new_release
        FROM TRANSACTIONS t
        JOIN PATRONS p ON t.patron_id = p.id
        JOIN LIBRARY_ITEM_COPIES ic ON t.copy_id = ic.id
        JOIN LIBRARY_ITEMS li ON ic.library_item_id = li.id
        LEFT JOIN BOOKS b ON li.id = b.library_item_id
        LEFT JOIN VIDEOS v ON li.id = v.library_item_id
        WHERE t.copy_id = ? AND t.patron_id = ? AND t.status = 'Active'
        ORDER BY t.created_at DESC
        LIMIT 1
      `;

      const results = await db.execute_query(query, [copy_id, patron_id]);
      const enriched_transaction = results[0];

      res.status(201).json({
        success: true,
        message: 'Item checked out successfully',
        data: {
          ...enriched_transaction,
          ...patron,
          ...item_copy,
          ...library_item,
          ...transaction_data,
        },
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to checkout item',
        message: error.message,
      });
    }
  }
);

// POST /api/v1/transactions/checkin - Checkin item
router.post(
  '/checkin',
  [
    body('new_condition')
      .optional()
      .isIn(['New', 'Excellent', 'Good', 'Fair', 'Poor'])
      .withMessage('Invalid condition'),
    body('copy_id').isInt({ min: 1 }).withMessage('Valid copy ID is required'),
  ],
  handle_validation_errors,
  async (req, res) => {
    try {
      const { copy_id, new_location_id, new_condition, notes } = req.body;

      // Validate new_location_id if provided
      if (new_location_id) {
        const branch = await db.get_by_id('BRANCHES', new_location_id);
        if (!branch) {
          return res.status(400).json({
            error: 'Invalid new_location_id: Branch not found',
          });
        }
      }

      // Find item copy
      const item_copy = await db.get_by_id('LIBRARY_ITEM_COPIES', copy_id);
      if (!item_copy) {
        return res.status(400).json({
          error: 'Item copy not found',
        });
      }

      // Find the check out transaction
      const check_out_transaction = await db.execute_query(
        'SELECT * FROM TRANSACTIONS WHERE copy_id = ? AND status = "Active" AND transaction_type = "checkout" LIMIT 1',
        [copy_id]
      );

      if (check_out_transaction.length === 0) {
        return res.status(400).json({
          error: 'No active transaction found for this item copy',
        });
      }

      const transaction = check_out_transaction[0];
      const return_date = new Date(); // today
      const due_date = new Date(transaction.due_date);

      // Calculate fine if overdue
      let fine_amount = 0;
      let days_overdue = 0;
      if (return_date > due_date) {
        days_overdue = Math.ceil(
          (return_date - due_date) / (1000 * 60 * 60 * 24)
        );
        fine_amount = days_overdue * 0.5; // $0.50 per day
      }
      const now = new Date().toISOString();

      //!! == Execute all database operations in a transaction  == !!
      const checkin_trans_id = await db.execute_transaction(async () => {
        // Update checkout transaction
        await db.update_record('TRANSACTIONS', transaction.id, {
          return_date: return_date.toISOString(),
          fine_amount,
          status: 'Completed',
          notes: notes || null,
          updated_at: now,
        });

        // Create a checkin transaction record
        const checkin_transaction_data = {
          copy_id,
          patron_id: transaction.patron_id,
          location_id: new_location_id || item_copy.current_branch_id,
          transaction_type: 'checkin',
          checkout_date: transaction.checkout_date,
          due_date: transaction.due_date,
          return_date: return_date.toISOString(),
          status: 'Completed',
          fine_amount,
          created_at: now,
          updated_at: now,
        };

        const trans_id = await db.create_record(
          'TRANSACTIONS',
          checkin_transaction_data
        );

        // Update item copy
        await db.update_record('LIBRARY_ITEM_COPIES', copy_id, {
          status: 'Unshelved',
          checked_out_by: null,
          due_date: null,
          current_branch_id: new_location_id || item_copy.current_branch_id,
          condition: new_condition || item_copy.condition,
          updated_at: now,
        });

        // Update patron balance if there's a fine
        if (fine_amount > 0) {
          await db.execute_query(
            'UPDATE PATRONS SET balance = balance + ? WHERE id = ?',
            [fine_amount, transaction.patron_id]
          );
        }

        return trans_id;
      });

      // Fetch enriched data for receipt (outside transaction)
      const receipt_query = `
        SELECT 
          t.id,
          t.copy_id,
          t.patron_id,
          t.location_id,
          t.transaction_type,
          t.checkout_date,
          t.due_date,
          t.return_date,
          t.fine_amount,
          t.status,
          t.notes,
          t.created_at,
          t.updated_at,
          p.first_name,
          p.last_name,
          p.email,
          p.phone,
          li.title,
          li.item_type,
          b.branch_name
        FROM TRANSACTIONS t
        JOIN PATRONS p ON t.patron_id = p.id
        JOIN LIBRARY_ITEM_COPIES ic ON t.copy_id = ic.id
        JOIN LIBRARY_ITEMS li ON ic.library_item_id = li.id
        JOIN BRANCHES b ON t.location_id = b.id
        WHERE t.id = ?
      `;

      const receipt_results = await db.execute_query(receipt_query, [
        checkin_trans_id,
      ]);
      const receipt_data = receipt_results[0];

      res.json({
        success: true,
        message: 'Item checked in successfully',
        data: receipt_data,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to checkin item',
        message: error.message,
      });
    }
  }
);

// PUT /api/v1/transactions/:id/renew - Renew transaction
router.put('/:id/renew', async (req, res) => {
  try {
    const transaction = await db.get_by_id('TRANSACTIONS', req.params.id);

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found',
      });
    }

    if (transaction.status !== 'Active') {
      return res.status(400).json({
        error: 'Only active transactions can be renewed',
      });
    }

    // Check if item has reservations
    const reservations = await db.execute_query(
      'SELECT COUNT(*) as count FROM RESERVATIONS WHERE library_item_id = (SELECT library_item_id FROM LIBRARY_ITEM_COPIES WHERE id = ?) AND status = "pending"',
      [transaction.copy_id]
    );

    if (reservations[0].count > 0) {
      return res.status(400).json({
        error: 'Item cannot be renewed due to pending reservations',
      });
    }

    // Extend due date by 14 days
    const current_due_date = new Date(transaction.due_date);
    const new_due_date = new Date(
      current_due_date.getTime() + 14 * 24 * 60 * 60 * 1000
    );

    const now = new Date().toISOString();

    // Update transaction
    await db.update_record('TRANSACTIONS', req.params.id, {
      due_date: new_due_date.toISOString(),
      updated_at: now,
    });

    // Update item copy
    await db.update_record('LIBRARY_ITEM_COPIES', transaction.copy_id, {
      due_date: new_due_date.toISOString(),
      updated_at: now,
    });

    res.json({
      success: true,
      message: 'Transaction renewed successfully',
      data: {
        transaction_id: req.params.id,
        new_due_date: new_due_date.toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to renew transaction',
      message: error.message,
    });
  }
});

// PUT /api/v1/reshelve/:id - Mark item copy as reshelved
router.put('/reshelve/:id', async (req, res) => {
  try {
    const item_copy = await db.get_by_id('LIBRARY_ITEM_COPIES', req.params.id);
    if (!item_copy) {
      return res.status(404).json({
        error: 'Item copy not found',
      });
    }

    // Mark item copy as reshelved
    await db.update_record('LIBRARY_ITEM_COPIES', item_copy.id, {
      status: 'Available',
      updated_at: new Date().toISOString(),
    });

    // Create a reshelve transaction record
    const now = new Date().toISOString();
    const reshelve_transaction_data = {
      copy_id: item_copy.id,
      location_id: item_copy.owning_branch_id,
      transaction_type: 'reshelve',
      created_at: now,
      updated_at: now,
      status: 'Completed',
    };

    await db.create_record('TRANSACTIONS', reshelve_transaction_data);

    res.json({
      success: true,
      message: 'Item copy marked as reshelved',
      data: {
        item_copy_id: item_copy.id,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to reshelve item copy',
      message: error.message,
    });
  }
});

export default router;
