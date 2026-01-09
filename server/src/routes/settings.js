import express from 'express';
import * as db from '../config/database.js';

const router = express.Router();

/**
 * GET /api/v1/settings/loan_durations - Get all Loan Durations
 */
router.get('/loan_durations', async (_, res) => {
  try {
    const query = `SELECT * FROM LOAN_DURATIONS;`;
    const results = await db.execute_query(query);

    res.json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch loan durations',
      message: error.message,
    });
  }
});

router.put('/loan_durations/:id', async (req, res) => {
  const duration_id = parseInt(req.params.id, 10);
  const { duration } = req.body;

  // Validate inputs
  if (Number.isNaN(duration_id)) {
    return res.status(400).json({
      error: 'Invalid loan duration ID',
      message: 'ID must be a valid number',
    });
  }

  if (duration == null || typeof duration !== 'number') {
    return res.status(400).json({
      error: 'Invalid duration value',
      message: 'Duration must be a valid number',
    });
  }

  if (!Number.isInteger(duration) || duration <= 0) {
    return res.status(400).json({
      error: 'Invalid duration value',
      message: 'Duration must be a positive integer',
    });
  }

  try {
    // Check if record exists
    const existing = await db.get_by_id('LOAN_DURATIONS', duration_id);
    if (!existing) {
      return res.status(404).json({
        error: 'Loan duration not found',
        message: `No loan duration found with ID ${duration_id}`,
      });
    }

    await db.update_record('LOAN_DURATIONS', duration_id, {
      duration,
    });
    res.json({ success: true, message: 'Loan duration updated successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update loan duration',
      message: error.message,
    });
  }
});

export default router;
