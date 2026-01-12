import cron from 'node-cron';
import pico from 'picocolors';
import * as db from '../config/database.js';
import { send_email } from '../config/email.js';
import { format_sql_datetime } from '../utils.js';

/**
 * Email Worker Service
 * Processes pending email notifications from the queue
 */

let is_worker_running = false;
let cron_job = null;

/**
 * Process pending emails from the queue
 */
async function process_email_queue() {
  if (is_worker_running) {
    console.log(pico.yellow('⏸️  Email worker already running, skipping...'));
    return;
  }

  is_worker_running = true;

  try {
    const now = format_sql_datetime(new Date());

    // Get pending emails that are scheduled for now or earlier, ordered by priority
    const pending_emails = await db.execute_query(
      `SELECT 
        en.*,
        p.first_name,
        p.last_name,
        p.email as patron_email
      FROM EMAIL_NOTIFICATIONS en
      LEFT JOIN PATRONS p ON en.patron_id = p.id
      WHERE en.status = 'pending'
        AND en.scheduled_for <= ?
      ORDER BY en.priority ASC, en.scheduled_for ASC
      LIMIT 50`,
      [now]
    );

    if (pending_emails.length === 0) {
      console.log(pico.dim('📧 No pending emails to process'));
      return;
    }

    console.log(
      pico.cyan(`📧 Processing ${pending_emails.length} pending email(s)...`)
    );

    let sent_count = 0;
    let failed_count = 0;

    for (const email of pending_emails) {
      try {
        // Send email via Nodemailer
        const success = await send_email_notification(email);

        if (success) {
          // Mark as sent
          await db.update_record('EMAIL_NOTIFICATIONS', email.id, {
            status: 'sent',
            sent_at: now,
            updated_at: now,
          });
          sent_count++;
          console.log(
            pico.green(
              `✅ Sent: ${email.email_type} to ${email.recipient_email}`
            )
          );
        } else {
          throw new Error('Email send failed');
        }
      } catch (error) {
        // Handle failure and retry logic
        const retry_count = email.retry_count + 1;
        const error_message =
          error instanceof Error ? error.message : 'Unknown error';

        if (retry_count >= email.max_retries) {
          // Max retries reached, mark as failed
          await db.update_record('EMAIL_NOTIFICATIONS', email.id, {
            status: 'failed',
            retry_count: retry_count,
            error_message: error_message,
            updated_at: now,
          });
          console.log(
            pico.red(
              `❌ Failed (max retries): ${email.email_type} to ${email.recipient_email} - ${error_message}`
            )
          );
        } else {
          // Schedule retry with exponential backoff
          const retry_delay_minutes = 2 ** retry_count * 5; // 5, 10, 20 minutes
          const retry_time = new Date(Date.now() + retry_delay_minutes * 60000);

          await db.update_record('EMAIL_NOTIFICATIONS', email.id, {
            retry_count: retry_count,
            error_message: error_message,
            scheduled_for: format_sql_datetime(retry_time),
            updated_at: now,
          });
          console.log(
            pico.yellow(
              `⚠️  Retry scheduled (${retry_count}/${email.max_retries}): ${email.email_type} in ${retry_delay_minutes}min`
            )
          );
        }
        failed_count++;
      }
    }

    console.log(
      pico.bgCyan(
        pico.bold(
          ` 📧 Email batch complete: ${sent_count} sent, ${failed_count} failed `
        )
      )
    );
  } catch (error) {
    const error_message =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(pico.bgRed('Email worker error:'), error_message);
  } finally {
    is_worker_running = false;
  }
}

/**
 * Send email via Nodemailer
 * @param {Object} email - Email notification object
 * @returns {Promise<boolean>} - Success status
 */
async function send_email_notification(email) {
  try {
    const result = await send_email({
      to: email.recipient_email,
      subject: email.subject,
      text: email.body_text,
      html: email.body_html,
    });

    console.log(pico.dim(`  → To: ${email.recipient_email}`));
    console.log(pico.dim(`  → Subject: ${email.subject}`));
    console.log(pico.dim(`  → Type: ${email.email_type}`));
    console.log(pico.dim(`  → MessageId: ${result.messageId}`));

    return true;
  } catch (error) {
    const error_message =
      error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Email send failed: ${error_message}`);
  }
}

/**
 * Clean up old sent emails (retention policy)
 * Keeps last 90 days of sent emails, all failed emails
 */
async function cleanup_old_emails() {
  try {
    const retention_days = 90;
    const cutoff_date = new Date();
    cutoff_date.setDate(cutoff_date.getDate() - retention_days);

    const result = await db.execute_query(
      `DELETE FROM EMAIL_NOTIFICATIONS 
       WHERE status = 'sent' 
         AND sent_at < ?`,
      [format_sql_datetime(cutoff_date)]
    );

    if (result.changes > 0) {
      console.log(
        pico.dim(
          `🧹 Cleaned up ${result.changes} old email notification(s) (>${retention_days} days)`
        )
      );
    }
  } catch (error) {
    const error_message =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(pico.red('Email cleanup error:'), error_message);
  }
}

/**
 * Start the email worker with cron schedule
 */
export function start_email_worker() {
  if (cron_job) {
    console.log(pico.yellow('⚠️  Email worker already started'));
    return;
  }

  // Run every 2 minutes
  cron_job = cron.schedule('*/2 * * * *', async () => {
    await process_email_queue();
  });

  // Run cleanup daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    await cleanup_old_emails();
  });

  console.log(pico.bgGreen(pico.bold('📧 Email Worker Started (every 2 min)')));

  // Run immediately on startup
  setTimeout(() => {
    process_email_queue();
  }, 5000); // 5 second delay to let server fully initialize
}

/**
 * Stop the email worker
 */
export function stop_email_worker() {
  if (cron_job) {
    cron_job.stop();
    cron_job = null;
    console.log(pico.yellow('📧 Email Worker Stopped'));
  }
}

/**
 * Manually trigger email processing (for testing/admin)
 */
export async function trigger_email_processing() {
  console.log(pico.cyan('📧 Manually triggering email processing...'));
  await process_email_queue();
}

/**
 * Get email queue statistics
 */
export async function get_email_queue_stats() {
  const stats = await db.execute_query(`
    SELECT 
      status,
      COUNT(*) as count,
      AVG(retry_count) as avg_retries
    FROM EMAIL_NOTIFICATIONS
    WHERE created_at > datetime('now', '-7 days')
    GROUP BY status
  `);

  const total_pending = await db.execute_query(
    `SELECT COUNT(*) as count FROM EMAIL_NOTIFICATIONS WHERE status = 'pending'`
  );

  return {
    by_status: stats,
    total_pending: total_pending[0]?.count || 0,
  };
}
