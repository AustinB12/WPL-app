import express from 'express';
import * as db from '../config/database.js';

const router = express.Router();

/**
 * GET /api/v1/analytics/circulation - Get circulation trends over time
 * Query params: start_date, end_date, interval (daily|weekly|monthly), branch_id
 */
router.get('/circulation', async (req, res) => {
  try {
    const { start_date, end_date, interval = 'daily', branch_id } = req.query;

    // Default to last 30 days if no dates provided
    const end = end_date || new Date().toISOString().split('T')[0];
    const start =
      start_date ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

    let date_group;
    switch (interval) {
      case 'weekly':
        date_group = "strftime('%Y-W%W', t.date)";
        break;
      case 'monthly':
        date_group = "strftime('%Y-%m', t.date)";
        break;
      default: // daily
        date_group = 'DATE(t.date)';
    }

    const branch_filter = branch_id ? 'AND t.location_id = ?' : '';
    const params = branch_id ? [start, end, branch_id] : [start, end];

    const query = `
      SELECT 
        ${date_group} as period,
        SUM(CASE WHEN UPPER(t.transaction_type) = 'CHECKOUT' THEN 1 ELSE 0 END) as checkouts,
        SUM(CASE WHEN UPPER(t.transaction_type) = 'CHECKIN' THEN 1 ELSE 0 END) as checkins,
        SUM(CASE WHEN UPPER(t.transaction_type) = 'RENEW' THEN 1 ELSE 0 END) as renewals
      FROM ITEM_TRANSACTIONS t
      WHERE DATE(t.date) BETWEEN ? AND ?
        ${branch_filter}
      GROUP BY ${date_group}
      ORDER BY period
    `;

    const results = await db.execute_query(query, params);

    const labels = results.map((r) => r.period);
    const checkouts = results.map((r) => r.checkouts);
    const checkins = results.map((r) => r.checkins);
    const renewals = results.map((r) => r.renewals);

    res.json({
      success: true,
      data: {
        labels,
        checkouts,
        checkins,
        renewals,
        interval,
        start_date: start,
        end_date: end,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch circulation trends',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/analytics/popular-items - Get popular items and genres
 * Query params: period (7d|30d|90d|1y), branch_id, limit
 */
router.get('/popular-items', async (req, res) => {
  try {
    const { period = '30d', branch_id, limit = 10 } = req.query;

    // Calculate date range based on period
    const days_map = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
    const days = days_map[period] || 30;
    const start_date = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const branch_filter = branch_id ? 'AND ic.owning_branch_id = ?' : '';
    const branch_param = branch_id
      ? [start_date, branch_id, limit]
      : [start_date, limit];

    // Top Items
    const top_items_query = `
      SELECT 
        li.id,
        li.title,
        li.item_type,
        COUNT(*) as checkout_count,
        COUNT(DISTINCT t.patron_id) as unique_patrons
      FROM ITEM_TRANSACTIONS t
      INNER JOIN LIBRARY_ITEM_COPIES ic ON t.item_copy_id = ic.id
      INNER JOIN LIBRARY_ITEMS li ON ic.library_item_id = li.id
      WHERE UPPER(t.transaction_type) = 'CHECKOUT'
        AND DATE(t.date) >= ?
        ${branch_filter}
      GROUP BY li.id, li.title, li.item_type
      ORDER BY checkout_count DESC
      LIMIT ?
    `;

    const top_items = await db.execute_query(top_items_query, branch_param);

    // Top Genres (Books)
    const top_genres_query = `
      SELECT 
        b.genre,
        COUNT(*) as checkout_count
      FROM ITEM_TRANSACTIONS t
      INNER JOIN LIBRARY_ITEM_COPIES ic ON t.item_copy_id = ic.id
      INNER JOIN LIBRARY_ITEMS li ON ic.library_item_id = li.id
      INNER JOIN BOOKS b ON li.id = b.library_item_id
      WHERE UPPER(t.transaction_type) = 'CHECKOUT'
        AND DATE(t.date) >= ?
        AND b.genre IS NOT NULL
        AND b.genre != ''
        ${branch_filter}
      GROUP BY b.genre
      ORDER BY checkout_count DESC
      LIMIT ?
    `;

    const top_genres = await db.execute_query(top_genres_query, branch_param);

    // By Item Type
    const by_type_query = `
      SELECT 
        li.item_type,
        COUNT(*) as checkout_count
      FROM ITEM_TRANSACTIONS t
      INNER JOIN LIBRARY_ITEM_COPIES ic ON t.item_copy_id = ic.id
      INNER JOIN LIBRARY_ITEMS li ON ic.library_item_id = li.id
      WHERE UPPER(t.transaction_type) = 'CHECKOUT'
        AND DATE(t.date) >= ?
        ${branch_filter}
      GROUP BY li.item_type
      ORDER BY checkout_count DESC
    `;

    const by_item_type = await db.execute_query(
      by_type_query,
      branch_id ? [start_date, branch_id] : [start_date]
    );

    res.json({
      success: true,
      data: {
        top_items,
        top_genres,
        by_item_type,
        period,
        start_date,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch popular items',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/analytics/patrons - Get patron activity metrics
 * Query params: period (7d|30d|90d|1y), branch_id
 */
router.get('/patrons', async (req, res) => {
  try {
    const { period = '30d', branch_id } = req.query;

    const days_map = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
    const days = days_map[period] || 30;
    const start_date = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const branch_filter = branch_id ? 'AND t.location_id = ?' : '';
    const branch_param = branch_id ? [start_date, branch_id] : [start_date];

    // Active patrons (with checkouts in period)
    const active_patrons_query = `
      SELECT COUNT(DISTINCT t.patron_id) as count
      FROM ITEM_TRANSACTIONS t
      WHERE UPPER(t.transaction_type) = 'CHECKOUT'
        AND DATE(t.date) >= ?
        ${branch_filter}
    `;

    const active_result = await db.execute_query(
      active_patrons_query,
      branch_param
    );
    const active_patrons = active_result[0]?.count || 0;

    // New registrations
    const new_patrons_query = `
      SELECT COUNT(*) as count
      FROM PATRONS p
      WHERE DATE(p.created_at) >= ?
        ${branch_id ? 'AND p.local_branch_id = ?' : ''}
    `;

    const new_result = await db.execute_query(new_patrons_query, branch_param);
    const new_registrations = new_result[0]?.count || 0;

    // Checkout distribution
    const distribution_query = `
      SELECT 
        t.patron_id,
        p.first_name,
        p.last_name,
        COUNT(*) as checkout_count
      FROM ITEM_TRANSACTIONS t
      INNER JOIN PATRONS p ON t.patron_id = p.id
      WHERE UPPER(t.transaction_type) = 'CHECKOUT'
        AND DATE(t.date) >= ?
        ${branch_filter}
      GROUP BY t.patron_id, p.first_name, p.last_name
      ORDER BY checkout_count DESC
      LIMIT 20
    `;

    const checkout_distribution = await db.execute_query(
      distribution_query,
      branch_param
    );

    // Patron types (categorize by checkout frequency)
    const patron_types = {
      heavy_users: 0, // 10+ checkouts
      regular_users: 0, // 3-9 checkouts
      light_users: 0, // 1-2 checkouts
    };

    checkout_distribution.forEach((patron) => {
      if (patron.checkout_count >= 10) {
        patron_types.heavy_users++;
      } else if (patron.checkout_count >= 3) {
        patron_types.regular_users++;
      } else {
        patron_types.light_users++;
      }
    });

    res.json({
      success: true,
      data: {
        active_patrons,
        new_registrations,
        checkout_distribution,
        patron_types,
        period,
        start_date,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch patron metrics',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/analytics/overdue - Get overdue items tracking by branch
 * Query params: branch_id
 */
router.get('/overdue', async (req, res) => {
  try {
    const { branch_id } = req.query;

    // Overdue items by branch
    const by_branch_query = `
      SELECT 
        b.id as branch_id,
        b.branch_name,
        COUNT(ic.id) as overdue_count,
        COALESCE(SUM(
          CASE 
            WHEN ic.due_date < datetime('now', 'localtime') 
            THEN (julianday('now') - julianday(ic.due_date)) * 1.0
            ELSE 0 
          END
        ), 0) as total_fines
      FROM BRANCHES b
      LEFT JOIN LIBRARY_ITEM_COPIES ic ON (ic.current_branch_id = b.id OR ic.owning_branch_id = b.id)
      WHERE UPPER(ic.status) IN ('CHECKED OUT', 'RENEWED ONCE', 'RENEWED TWICE')
        AND ic.due_date < datetime('now', 'localtime')
        ${branch_id ? 'AND b.id = ?' : ''}
      GROUP BY b.id, b.branch_name
      ORDER BY overdue_count DESC
    `;

    const by_branch = await db.execute_query(
      by_branch_query,
      branch_id ? [branch_id] : []
    );

    // Detailed overdue items
    const overdue_items_query = `
      SELECT 
        ic.id as copy_id,
        li.title,
        li.item_type,
        ic.due_date,
        CAST((julianday('now') - julianday(ic.due_date)) AS INTEGER) as days_overdue,
        (julianday('now') - julianday(ic.due_date)) * 1.0 as fine_amount,
        b.branch_name,
        b.id as branch_id,
        p.first_name,
        p.last_name,
        p.id as patron_id
      FROM LIBRARY_ITEM_COPIES ic
      INNER JOIN LIBRARY_ITEMS li ON ic.library_item_id = li.id
      INNER JOIN BRANCHES b ON ic.current_branch_id = b.id
      LEFT JOIN PATRONS p ON ic.checked_out_by = p.id
      WHERE UPPER(ic.status) IN ('CHECKED OUT', 'RENEWED ONCE', 'RENEWED TWICE')
        AND ic.due_date < datetime('now', 'localtime')
        ${branch_id ? 'AND b.id = ?' : ''}
      ORDER BY days_overdue DESC
      LIMIT 100
    `;

    const overdue_items = await db.execute_query(
      overdue_items_query,
      branch_id ? [branch_id] : []
    );

    // Overdue trend (last 8 weeks)
    const trend_query = `
      SELECT 
        strftime('%Y-W%W', lic.due_date) as week,
        COUNT(DISTINCT lic.id) as count
      FROM LIBRARY_ITEM_COPIES lic
      WHERE lic.due_date < datetime('now', 'localtime')
        ${branch_id ? 'AND lic.current_branch_id = ?' : ''}
      GROUP BY week
      ORDER BY week
    `;

    const trend_results = await db.execute_query(
      trend_query,
      branch_id ? [branch_id] : []
    );

    const overdue_trend = {
      labels: trend_results.map((r) => r.week),
      counts: trend_results.map((r) => r.count),
    };

    res.json({
      success: true,
      data: {
        by_branch,
        overdue_items,
        overdue_trend,
        total_overdue: overdue_items.length,
        total_fines: by_branch.reduce(
          (sum, b) => sum + (b.total_fines || 0),
          0
        ),
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch overdue tracking data',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/analytics/collection-utilization - Get collection utilization metrics
 * Query params: branch_id, min_days (minimum days in collection)
 */
router.get('/collection-utilization', async (req, res) => {
  try {
    const { branch_id, min_days = 30 } = req.query;

    const branch_filter = branch_id ? 'AND ic.owning_branch_id = ?' : '';
    const branch_param = branch_id ? [min_days, branch_id] : [min_days];

    // Items never checked out
    const never_checked_query = `
      SELECT 
        li.id as item_id,
        li.title,
        li.item_type,
        ic.id as copy_id,
        ic.date_acquired,
        CAST(julianday('now') - julianday(ic.date_acquired) AS INTEGER) as days_in_collection,
        b.branch_name
      FROM LIBRARY_ITEMS li
      INNER JOIN LIBRARY_ITEM_COPIES ic ON li.id = ic.library_item_id
      LEFT JOIN BRANCHES b ON ic.owning_branch_id = b.id
      WHERE ic.id NOT IN (
        SELECT DISTINCT item_copy_id 
        FROM ITEM_TRANSACTIONS 
        WHERE UPPER(transaction_type) = 'CHECKOUT'
      )
      AND julianday('now') - julianday(ic.date_acquired) >= ?
      ${branch_filter}
      ORDER BY days_in_collection DESC
      LIMIT 100
    `;

    const never_checked_out = await db.execute_query(
      never_checked_query,
      branch_param
    );

    // Checkout rate by item type
    const utilization_query = `
      SELECT 
        li.item_type,
        COUNT(DISTINCT ic.id) as total_copies,
        COUNT(DISTINCT CASE 
          WHEN ic.id IN (
            SELECT DISTINCT item_copy_id 
            FROM ITEM_TRANSACTIONS 
            WHERE UPPER(transaction_type) = 'CHECKOUT'
          ) THEN ic.id 
        END) as checked_out_ever,
        CAST(COUNT(DISTINCT CASE 
          WHEN ic.id IN (
            SELECT DISTINCT item_copy_id 
            FROM ITEM_TRANSACTIONS 
            WHERE UPPER(transaction_type) = 'CHECKOUT'
          ) THEN ic.id 
        END) AS REAL) / COUNT(DISTINCT ic.id) as utilization_rate
      FROM LIBRARY_ITEMS li
      INNER JOIN LIBRARY_ITEM_COPIES ic ON li.id = ic.library_item_id
      WHERE 1=1
        ${branch_filter}
      GROUP BY li.item_type
      ORDER BY utilization_rate DESC
    `;

    const checkout_rate_by_type = await db.execute_query(
      utilization_query,
      branch_id ? [branch_id] : []
    );

    // Age analysis
    const age_analysis_query = `
      SELECT 
        CASE 
          WHEN julianday('now') - julianday(ic.date_acquired) < 180 THEN '0-6 months'
          WHEN julianday('now') - julianday(ic.date_acquired) < 365 THEN '6-12 months'
          WHEN julianday('now') - julianday(ic.date_acquired) < 730 THEN '1-2 years'
          ELSE '2+ years'
        END as age_range,
        COUNT(DISTINCT ic.id) as total_items,
        COUNT(DISTINCT CASE 
          WHEN ic.id NOT IN (
            SELECT DISTINCT item_copy_id 
            FROM ITEM_TRANSACTIONS 
            WHERE UPPER(transaction_type) = 'CHECKOUT'
          ) THEN ic.id 
        END) as never_checked
      FROM LIBRARY_ITEM_COPIES ic
      WHERE 1=1
        ${branch_filter}
      GROUP BY age_range
      ORDER BY 
        CASE age_range
          WHEN '0-6 months' THEN 1
          WHEN '6-12 months' THEN 2
          WHEN '1-2 years' THEN 3
          ELSE 4
        END
    `;

    const age_results = await db.execute_query(
      age_analysis_query,
      branch_id ? [branch_id] : []
    );

    const age_analysis = {
      labels: age_results.map((r) => r.age_range),
      never_checked: age_results.map((r) => r.never_checked),
      total_items: age_results.map((r) => r.total_items),
    };

    res.json({
      success: true,
      data: {
        never_checked_out,
        checkout_rate_by_type,
        age_analysis,
        summary: {
          total_never_checked: never_checked_out.length,
          oldest_item_days: never_checked_out[0]?.days_in_collection || 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch collection utilization data',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/analytics/summary - Get overall analytics summary
 */
router.get('/summary', async (req, res) => {
  try {
    const { branch_id } = req.query;
    const _branch_filter = branch_id ? 'WHERE b.id = ?' : '';
    const branch_param = branch_id ? [branch_id] : [];

    // Total collection size
    const collection_query = `
      SELECT COUNT(DISTINCT ic.id) as count
      FROM LIBRARY_ITEM_COPIES ic
      ${branch_id ? 'WHERE ic.owning_branch_id = ?' : ''}
    `;
    const collection = await db.execute_query(collection_query, branch_param);

    // Total active patrons
    const patrons_query = `
      SELECT COUNT(*) as count
      FROM PATRONS
      WHERE is_active = 1
        ${branch_id ? 'AND local_branch_id = ?' : ''}
    `;
    const patrons = await db.execute_query(patrons_query, branch_param);

    // Current checkouts
    const checkouts_query = `
      SELECT COUNT(*) as count
      FROM LIBRARY_ITEM_COPIES ic
      WHERE UPPER(ic.status) IN ('CHECKED OUT', 'RENEWED ONCE', 'RENEWED TWICE')
        ${branch_id ? 'AND ic.current_branch_id = ?' : ''}
    `;
    const checkouts = await db.execute_query(checkouts_query, branch_param);

    // Overdue count
    const overdue_query = `
      SELECT COUNT(*) as count
      FROM LIBRARY_ITEM_COPIES ic
      WHERE UPPER(ic.status) IN ('CHECKED OUT', 'RENEWED ONCE', 'RENEWED TWICE')
        AND ic.due_date < datetime('now', 'localtime')
        ${branch_id ? 'AND ic.current_branch_id = ?' : ''}
    `;
    const overdue = await db.execute_query(overdue_query, branch_param);

    res.json({
      success: true,
      data: {
        collection_size: collection[0]?.count || 0,
        active_patrons: patrons[0]?.count || 0,
        current_checkouts: checkouts[0]?.count || 0,
        overdue_items: overdue[0]?.count || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch analytics summary',
      message: error.message,
    });
  }
});

export default router;
