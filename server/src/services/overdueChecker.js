import cron from 'node-cron';
import pico from 'picocolors';
import * as db from '../config/database.js';
import {
  queue_due_date_reminder,
  queue_overdue_reminder,
} from './emailService.js';

/**
 * Overdue Items Checker
 * Daily cron job to check for overdue items and send reminder emails
 */

let overdue_cron_job = null;

/**
 * Check for overdue items and queue reminder emails
 */
async function check_overdue_items() {
  try {
    console.log(pico.cyan('📅 Checking for overdue items...'));

    const _now = new Date();

    // Get all active checkouts that are overdue
    const overdue_items = await db.execute_query(`
      SELECT 
        ic.id as copy_id,
        ic.library_item_id,
        ic.due_date,
        ic.checked_out_by as patron_id,
        li.title,
        li.item_type,
        p.id as patron_id,
        p.first_name,
        p.last_name,
        p.email,
        t.id as transaction_id,
        t.date as checkout_date,
        CAST((julianday('now') - julianday(ic.due_date)) AS INTEGER) as days_overdue
      FROM LIBRARY_ITEM_COPIES ic
      INNER JOIN LIBRARY_ITEMS li ON ic.library_item_id = li.id
      INNER JOIN PATRONS p ON ic.checked_out_by = p.id
      INNER JOIN ITEM_TRANSACTIONS t ON t.item_copy_id = ic.id 
        AND t.patron_id = p.id 
        AND UPPER(t.transaction_type) = 'CHECKOUT'
      WHERE UPPER(ic.status) IN ('CHECKED OUT', 'RENEWED ONCE', 'RENEWED TWICE')
        AND ic.due_date < datetime('now', 'localtime')
        AND ic.due_date IS NOT NULL
        AND p.email IS NOT NULL
        AND p.email != ''
      ORDER BY days_overdue DESC
    `);

    if (overdue_items.length === 0) {
      console.log(pico.dim('  No overdue items found'));
      return;
    }

    console.log(pico.yellow(`  Found ${overdue_items.length} overdue items`));

    let queued_count = 0;
    const fine_per_day = 1.0; // $1.00 per day

    for (const item of overdue_items) {
      try {
        const days_overdue = item.days_overdue;
        const fine_amount = days_overdue * fine_per_day;

        // Check if we've already sent a reminder recently (within 3 days)
        const recent_reminders = await db.execute_query(
          `SELECT id FROM EMAIL_NOTIFICATIONS 
           WHERE patron_id = ? 
             AND email_type = 'overdue_reminder'
             AND related_item_copy_id = ?
             AND created_at > datetime('now', '-3 days')
           LIMIT 1`,
          [item.patron_id, item.copy_id]
        );

        if (recent_reminders.length > 0) {
          // Already sent a reminder recently, skip
          continue;
        }

        // Queue overdue reminder email
        await queue_overdue_reminder(
          {
            id: item.patron_id,
            first_name: item.first_name,
            last_name: item.last_name,
            email: item.email,
          },
          {
            title: item.title,
            item_type: item.item_type,
            copy_id: item.copy_id,
          },
          {
            id: item.transaction_id,
            due_date: item.due_date,
          },
          days_overdue,
          fine_amount
        );

        queued_count++;
      } catch (error) {
        console.error(
          pico.red(
            `Failed to queue overdue reminder for copy ${item.copy_id}:`
          ),
          error
        );
      }
    }

    console.log(
      pico.bgCyan(
        pico.bold(` 📧 Queued ${queued_count} overdue reminder email(s) `)
      )
    );
  } catch (error) {
    const error_message =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(pico.bgRed('Overdue check error:'), error_message);
  }
}

/**
 * Check for items due soon (2-3 days) and send reminders
 */
async function check_due_soon_items() {
  try {
    console.log(pico.cyan('📅 Checking for items due soon...'));

    // Get items due in the next 2-3 days
    const due_soon_items = await db.execute_query(`
      SELECT 
        ic.id as copy_id,
        ic.library_item_id,
        ic.due_date,
        ic.checked_out_by as patron_id,
        li.title,
        li.item_type,
        p.id as patron_id,
        p.first_name,
        p.last_name,
        p.email,
        t.id as transaction_id,
        CAST((julianday(ic.due_date) - julianday('now')) AS INTEGER) as days_until_due
      FROM LIBRARY_ITEM_COPIES ic
      INNER JOIN LIBRARY_ITEMS li ON ic.library_item_id = li.id
      INNER JOIN PATRONS p ON ic.checked_out_by = p.id
      INNER JOIN ITEM_TRANSACTIONS t ON t.item_copy_id = ic.id 
        AND t.patron_id = p.id 
        AND UPPER(t.transaction_type) = 'CHECKOUT'
      WHERE UPPER(ic.status) IN ('CHECKED OUT', 'RENEWED ONCE', 'RENEWED TWICE')
        AND ic.due_date BETWEEN datetime('now', 'localtime') AND datetime('now', '+3 days', 'localtime')
        AND ic.due_date IS NOT NULL
        AND p.email IS NOT NULL
        AND p.email != ''
    `);

    if (due_soon_items.length === 0) {
      console.log(pico.dim('  No items due soon'));
      return;
    }

    console.log(pico.yellow(`  Found ${due_soon_items.length} items due soon`));

    let queued_count = 0;

    for (const item of due_soon_items) {
      try {
        // Check if we've already sent a due date reminder for this item
        const recent_reminders = await db.execute_query(
          `SELECT id FROM EMAIL_NOTIFICATIONS 
           WHERE patron_id = ? 
             AND email_type = 'due_date_reminder'
             AND related_item_copy_id = ?
             AND created_at > datetime('now', '-5 days')
           LIMIT 1`,
          [item.patron_id, item.copy_id]
        );

        if (recent_reminders.length > 0) {
          // Already sent a reminder, skip
          continue;
        }

        // Queue due date reminder email
        await queue_due_date_reminder(
          {
            id: item.patron_id,
            first_name: item.first_name,
            last_name: item.last_name,
            email: item.email,
          },
          {
            title: item.title,
            item_type: item.item_type,
            copy_id: item.copy_id,
          },
          {
            id: item.transaction_id,
            due_date: item.due_date,
          }
        );

        queued_count++;
      } catch (error) {
        console.error(
          pico.red(
            `Failed to queue due date reminder for copy ${item.copy_id}:`
          ),
          error
        );
      }
    }

    console.log(
      pico.bgCyan(
        pico.bold(` 📧 Queued ${queued_count} due date reminder email(s) `)
      )
    );
  } catch (error) {
    const error_message =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(pico.bgRed('Due soon check error:'), error_message);
  }
}

/**
 * Start the overdue checker cron job
 */
export function start_overdue_checker() {
  if (overdue_cron_job) {
    console.log(pico.yellow('⚠️  Overdue checker already started'));
    return;
  }

  // Run daily at 8 AM for overdue items
  overdue_cron_job = cron.schedule('0 8 * * *', async () => {
    await check_overdue_items();
  });

  // Run daily at 9 AM for items due soon
  cron.schedule('0 9 * * *', async () => {
    await check_due_soon_items();
  });

  console.log(
    pico.bgGreen(pico.bold('📅 Overdue Checker Started (daily at 8 AM & 9 AM)'))
  );

  // Run immediately on startup for testing (commented out for production)
  // setTimeout(async () => {
  //   await check_overdue_items();
  //   await check_due_soon_items();
  // }, 10000); // 10 second delay
}

/**
 * Stop the overdue checker
 */
export function stop_overdue_checker() {
  if (overdue_cron_job) {
    overdue_cron_job.stop();
    overdue_cron_job = null;
    console.log(pico.yellow('📅 Overdue Checker Stopped'));
  }
}

/**
 * Manually trigger overdue check (for testing/admin)
 */
export async function trigger_overdue_check() {
  console.log(pico.cyan('📅 Manually triggering overdue check...'));
  await check_overdue_items();
  await check_due_soon_items();
}
