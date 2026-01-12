import express from 'express';
import * as db from '../config/database.js';
import {
  get_email_queue_stats,
  trigger_email_processing,
} from '../services/email_worker.js';
import { trigger_overdue_check } from '../services/overdue_checker.js';
import { format_sql_datetime } from '../utils.js';

const router = express.Router();

/**
 * GET /api/v1/emails - Get all email notifications with filtering
 */
router.get('/', async (req, res) => {
  try {
    const {
      status,
      email_type,
      patron_id,
      limit = 100,
      offset = 0,
    } = req.query;

    const where_clauses = [];
    const params = [];

    if (status) {
      where_clauses.push('en.status = ?');
      params.push(status);
    }

    if (email_type) {
      where_clauses.push('en.email_type = ?');
      params.push(email_type);
    }

    if (patron_id) {
      where_clauses.push('en.patron_id = ?');
      params.push(patron_id);
    }

    const where_sql =
      where_clauses.length > 0 ? `WHERE ${where_clauses.join(' AND ')}` : '';

    const query = `
      SELECT 
        en.*,
        p.first_name,
        p.last_name,
        p.email as patron_email
      FROM EMAIL_NOTIFICATIONS en
      LEFT JOIN PATRONS p ON en.patron_id = p.id
      ${where_sql}
      ORDER BY en.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const emails = await db.execute_query(query, params);

    // Get total count
    const count_query = `
      SELECT COUNT(*) as total 
      FROM EMAIL_NOTIFICATIONS en
      ${where_sql}
    `;
    const count_params = params.slice(0, -2); // Remove limit and offset
    const count_result = await db.execute_query(count_query, count_params);
    const total = count_result[0]?.total || 0;

    res.json({
      success: true,
      data: emails,
      pagination: {
        total,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        has_more: total > parseInt(offset, 10) + parseInt(limit, 10),
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch email notifications',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/emails/stats - Get email queue statistics
 */
router.get('/stats', async (_req, res) => {
  try {
    const stats = await get_email_queue_stats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch email statistics',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/emails/:id - Get single email notification
 */
router.get('/:id', async (req, res) => {
  try {
    const email = await db.get_by_id('EMAIL_NOTIFICATIONS', req.params.id);

    if (!email) {
      return res.status(404).json({
        error: 'Email notification not found',
      });
    }

    // Get patron info
    const patron = await db.get_by_id('PATRONS', email.patron_id);

    res.json({
      success: true,
      data: {
        ...email,
        patron: patron
          ? {
              id: patron.id,
              first_name: patron.first_name,
              last_name: patron.last_name,
              email: patron.email,
            }
          : null,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch email notification',
      message: error.message,
    });
  }
});

/**
 * POST /api/v1/emails/:id/retry - Retry failed email
 */
router.post('/:id/retry', async (req, res) => {
  try {
    const email = await db.get_by_id('EMAIL_NOTIFICATIONS', req.params.id);

    if (!email) {
      return res.status(404).json({
        error: 'Email notification not found',
      });
    }

    if (email.status !== 'failed') {
      return res.status(400).json({
        error: 'Only failed emails can be retried',
        current_status: email.status,
      });
    }

    // Reset email to pending status
    await db.update_record('EMAIL_NOTIFICATIONS', req.params.id, {
      status: 'pending',
      retry_count: 0,
      error_message: null,
      scheduled_for: format_sql_datetime(new Date()),
      updated_at: format_sql_datetime(new Date()),
    });

    res.json({
      success: true,
      message: 'Email queued for retry',
      data: {
        id: req.params.id,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retry email',
      message: error.message,
    });
  }
});

/**
 * POST /api/v1/emails/:id/cancel - Cancel pending email
 */
router.post('/:id/cancel', async (req, res) => {
  try {
    const email = await db.get_by_id('EMAIL_NOTIFICATIONS', req.params.id);

    if (!email) {
      return res.status(404).json({
        error: 'Email notification not found',
      });
    }

    if (email.status !== 'pending') {
      return res.status(400).json({
        error: 'Only pending emails can be cancelled',
        current_status: email.status,
      });
    }

    await db.update_record('EMAIL_NOTIFICATIONS', req.params.id, {
      status: 'cancelled',
      updated_at: format_sql_datetime(new Date()),
    });

    res.json({
      success: true,
      message: 'Email cancelled',
      data: {
        id: req.params.id,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to cancel email',
      message: error.message,
    });
  }
});

/**
 * POST /api/v1/emails/trigger-processing - Manually trigger email processing
 */
router.post('/trigger-processing', async (_req, res) => {
  try {
    // Trigger email processing in background (don't await)
    trigger_email_processing().catch((error) => {
      console.error('Email processing error:', error);
    });

    res.json({
      success: true,
      message: 'Email processing triggered',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to trigger email processing',
      message: error.message,
    });
  }
});

/**
 * POST /api/v1/emails/trigger-overdue-check - Manually trigger overdue check
 */
router.post('/trigger-overdue-check', async (_req, res) => {
  try {
    // Trigger overdue check in background (don't await)
    trigger_overdue_check().catch((error) => {
      console.error('Overdue check error:', error);
    });

    res.json({
      success: true,
      message: 'Overdue check triggered',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to trigger overdue check',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/v1/emails/:id - Delete email notification (admin only)
 */
router.delete('/:id', async (req, res) => {
  try {
    const email = await db.get_by_id('EMAIL_NOTIFICATIONS', req.params.id);

    if (!email) {
      return res.status(404).json({
        error: 'Email notification not found',
      });
    }

    await db.execute_query('DELETE FROM EMAIL_NOTIFICATIONS WHERE id = ?', [
      req.params.id,
    ]);

    res.json({
      success: true,
      message: 'Email notification deleted',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete email notification',
      message: error.message,
    });
  }
});

export default router;
