import express from 'express';
import * as db from '../config/database.js';

const router = express.Router();

/**
 * GET /api/v1/settings/loan_durations - Get all Loan Durations
 */
router.get('/loan_durations', async (req, res) => {
  const query = `SELECT * FROM LOAN_DURATIONS;`;

  await db
    .execute_query(query)
    .then(function (results) {
      res.json({
        success: true,
        count: results.length,
        data: results,
      });
    })
    .catch(function (error) {
      res.status(500).json({
        error: 'Failed to fetch loan durations',
        message: error.message,
      });
    });
});

router.put('/loan_durations/:id', async (req, res) => {
  const duration_id = parseInt(req.params.id);
  const { duration } = req.body;

  if (isNaN(duration_id) || duration === undefined) {
    return res.status(400).json({ error: 'Invalid input data' });
  }

  try {
    await db.update_record('LOAN_DURATIONS', duration_id, {
      duration: duration,
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
