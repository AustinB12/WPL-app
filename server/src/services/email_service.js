import * as db from '../config/database.js';
import { format_sql_datetime } from '../utils.js';

/**
 * Email Service
 * Helper functions to queue emails for various notification types
 */

/**
 * Queue an email notification
 * @param {Object} options - Email options
 * @param {number} options.patron_id - Patron ID
 * @param {string} options.email_type - Type of email (e.g., 'overdue_reminder', 'reservation_ready')
 * @param {string} options.recipient_email - Email address
 * @param {string} options.subject - Email subject
 * @param {string} options.body_text - Plain text email body
 * @param {string} [options.body_html] - HTML email body (optional)
 * @param {number} [options.priority=5] - Priority (1-10, 1 is highest)
 * @param {Date} [options.scheduled_for] - When to send (defaults to now)
 * @param {Object} [options.metadata] - Additional metadata as JSON object
 * @param {number} [options.related_item_copy_id] - Related item copy ID
 * @param {number} [options.related_transaction_id] - Related transaction ID
 * @param {number} [options.related_reservation_id] - Related reservation ID
 * @param {number} [options.related_fine_id] - Related fine ID
 * @returns {Promise<number>} - Email notification ID
 */
export async function queue_email(options) {
  const {
    patron_id,
    email_type,
    recipient_email,
    subject,
    body_text,
    body_html = null,
    priority = 5,
    scheduled_for = new Date(),
    metadata = null,
    related_item_copy_id = null,
    related_transaction_id = null,
    related_reservation_id = null,
    related_fine_id = null,
  } = options;

  const email_data = {
    patron_id,
    email_type,
    recipient_email,
    subject,
    body_text,
    body_html,
    status: 'pending',
    priority,
    scheduled_for: format_sql_datetime(scheduled_for),
    metadata: metadata ? JSON.stringify(metadata) : null,
    related_item_copy_id,
    related_transaction_id,
    related_reservation_id,
    related_fine_id,
    retry_count: 0,
    max_retries: 3,
  };

  const result = await db.create_record('EMAIL_NOTIFICATIONS', email_data);
  return result.lastID;
}

/**
 * Queue overdue reminder email
 */
export async function queue_overdue_reminder(
  patron,
  item,
  transaction,
  days_overdue,
  fine_amount
) {
  const subject = `Overdue Item Reminder: ${item.title}`;
  const body_text = `Dear ${patron.first_name} ${patron.last_name},

This is a reminder that the following item is overdue:

Title: ${item.title}
Type: ${item.item_type}
Due Date: ${new Date(transaction.due_date).toLocaleDateString()}
Days Overdue: ${days_overdue}
Current Fine: $${fine_amount.toFixed(2)}

Please return the item as soon as possible to avoid additional fines.

You can return items to any library branch during operating hours.

Thank you,
Wayback Public Library`;

  const body_html = `
    <h2>Overdue Item Reminder</h2>
    <p>Dear ${patron.first_name} ${patron.last_name},</p>
    <p>This is a reminder that the following item is overdue:</p>
    <ul>
      <li><strong>Title:</strong> ${item.title}</li>
      <li><strong>Type:</strong> ${item.item_type}</li>
      <li><strong>Due Date:</strong> ${new Date(transaction.due_date).toLocaleDateString()}</li>
      <li><strong>Days Overdue:</strong> ${days_overdue}</li>
      <li><strong>Current Fine:</strong> $${fine_amount.toFixed(2)}</li>
    </ul>
    <p>Please return the item as soon as possible to avoid additional fines.</p>
    <p>You can return items to any library branch during operating hours.</p>
    <p>Thank you,<br>Wayback Public Library</p>
  `;

  return await queue_email({
    patron_id: patron.id,
    email_type: 'overdue_reminder',
    recipient_email: patron.email,
    subject,
    body_text,
    body_html,
    priority: 3, // High priority
    related_item_copy_id: item.copy_id,
    related_transaction_id: transaction.id,
    metadata: { days_overdue, fine_amount },
  });
}

/**
 * Queue reservation ready email
 */
export async function queue_reservation_ready(patron, item, reservation) {
  const expiry_date = new Date(reservation.expiry_date);
  const subject = `Your Reserved Item is Ready: ${item.title}`;

  const body_text = `Dear ${patron.first_name} ${patron.last_name},

Good news! The item you reserved is now ready for pickup:

Title: ${item.title}
Type: ${item.item_type}

Please pick up your item by ${expiry_date.toLocaleDateString()} or your reservation will expire.

You can pick up your item at any library branch during operating hours.

Thank you,
Wayback Public Library`;

  const body_html = `
    <h2>Your Reserved Item is Ready!</h2>
    <p>Dear ${patron.first_name} ${patron.last_name},</p>
    <p>Good news! The item you reserved is now ready for pickup:</p>
    <ul>
      <li><strong>Title:</strong> ${item.title}</li>
      <li><strong>Type:</strong> ${item.item_type}</li>
    </ul>
    <p><strong>Please pick up your item by ${expiry_date.toLocaleDateString()}</strong> or your reservation will expire.</p>
    <p>You can pick up your item at any library branch during operating hours.</p>
    <p>Thank you,<br>Wayback Public Library</p>
  `;

  return await queue_email({
    patron_id: patron.id,
    email_type: 'reservation_ready',
    recipient_email: patron.email,
    subject,
    body_text,
    body_html,
    priority: 2, // Higher priority
    related_item_copy_id: item.id,
    related_reservation_id: reservation.id,
  });
}

/**
 * Queue due date reminder email (2-3 days before due)
 */
export async function queue_due_date_reminder(patron, item, transaction) {
  const due_date = new Date(transaction.due_date);
  const days_until_due = Math.ceil(
    (due_date - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const subject = `Item Due Soon: ${item.title}`;
  const body_text = `Dear ${patron.first_name} ${patron.last_name},

This is a friendly reminder that the following item is due soon:

Title: ${item.title}
Type: ${item.item_type}
Due Date: ${due_date.toLocaleDateString()} (in ${days_until_due} days)

You can renew this item online or at any library branch if it's eligible for renewal.

Thank you,
Wayback Public Library`;

  const body_html = `
    <h2>Item Due Soon</h2>
    <p>Dear ${patron.first_name} ${patron.last_name},</p>
    <p>This is a friendly reminder that the following item is due soon:</p>
    <ul>
      <li><strong>Title:</strong> ${item.title}</li>
      <li><strong>Type:</strong> ${item.item_type}</li>
      <li><strong>Due Date:</strong> ${due_date.toLocaleDateString()} (in ${days_until_due} days)</li>
    </ul>
    <p>You can renew this item online or at any library branch if it's eligible for renewal.</p>
    <p>Thank you,<br>Wayback Public Library</p>
  `;

  return await queue_email({
    patron_id: patron.id,
    email_type: 'due_date_reminder',
    recipient_email: patron.email,
    subject,
    body_text,
    body_html,
    priority: 5, // Normal priority
    related_item_copy_id: item.copy_id,
    related_transaction_id: transaction.id,
    metadata: { days_until_due },
  });
}

/**
 * Queue checkout receipt email
 */
export async function queue_checkout_receipt(patron, item, transaction) {
  const due_date = new Date(transaction.due_date);
  const subject = `Checkout Receipt: ${item.title}`;

  const body_text = `Dear ${patron.first_name} ${patron.last_name},

Thank you for checking out:

Title: ${item.title}
Type: ${item.item_type}
Copy ID: ${item.copy_id}
Checkout Date: ${new Date(transaction.date).toLocaleDateString()}
Due Date: ${due_date.toLocaleDateString()}

Please return this item by the due date to avoid late fees.

Thank you,
Wayback Public Library`;

  const body_html = `
    <h2>Checkout Receipt</h2>
    <p>Dear ${patron.first_name} ${patron.last_name},</p>
    <p>Thank you for checking out:</p>
    <ul>
      <li><strong>Title:</strong> ${item.title}</li>
      <li><strong>Type:</strong> ${item.item_type}</li>
      <li><strong>Copy ID:</strong> ${item.copy_id}</li>
      <li><strong>Checkout Date:</strong> ${new Date(transaction.date).toLocaleDateString()}</li>
      <li><strong>Due Date:</strong> ${due_date.toLocaleDateString()}</li>
    </ul>
    <p>Please return this item by the due date to avoid late fees.</p>
    <p>Thank you,<br>Wayback Public Library</p>
  `;

  return await queue_email({
    patron_id: patron.id,
    email_type: 'checkout_receipt',
    recipient_email: patron.email,
    subject,
    body_text,
    body_html,
    priority: 7, // Lower priority (not urgent)
    related_item_copy_id: item.copy_id,
    related_transaction_id: transaction.id,
  });
}

/**
 * Queue checkin receipt email
 */
export async function queue_checkin_receipt(
  patron,
  item,
  transaction,
  fine_amount = 0
) {
  const subject =
    fine_amount > 0
      ? `Return Processed with Fine: ${item.title}`
      : `Return Processed: ${item.title}`;

  const fine_text =
    fine_amount > 0
      ? `\n\nA late fee of $${fine_amount.toFixed(2)} has been added to your account.`
      : '';

  const body_text = `Dear ${patron.first_name} ${patron.last_name},

Your return has been processed:

Title: ${item.title}
Type: ${item.item_type}
Return Date: ${new Date(transaction.date).toLocaleDateString()}${fine_text}

Thank you for returning this item!

Wayback Public Library`;

  const fine_html =
    fine_amount > 0
      ? `<p><strong>A late fee of $${fine_amount.toFixed(2)} has been added to your account.</strong></p>`
      : '';

  const body_html = `
    <h2>Return Processed</h2>
    <p>Dear ${patron.first_name} ${patron.last_name},</p>
    <p>Your return has been processed:</p>
    <ul>
      <li><strong>Title:</strong> ${item.title}</li>
      <li><strong>Type:</strong> ${item.item_type}</li>
      <li><strong>Return Date:</strong> ${new Date(transaction.date).toLocaleDateString()}</li>
    </ul>
    ${fine_html}
    <p>Thank you for returning this item!</p>
    <p>Wayback Public Library</p>
  `;

  return await queue_email({
    patron_id: patron.id,
    email_type: 'checkin_receipt',
    recipient_email: patron.email,
    subject,
    body_text,
    body_html,
    priority: 7, // Lower priority
    related_item_copy_id: item.copy_id,
    related_transaction_id: transaction.id,
    metadata: { fine_amount },
  });
}

/**
 * Cancel pending emails for a specific patron/item combination
 */
export async function cancel_pending_emails(filters) {
  const { patron_id, email_type, related_item_copy_id } = filters;

  const where_clauses = ['status = ?'];
  const params = ['pending'];

  if (patron_id) {
    where_clauses.push('patron_id = ?');
    params.push(patron_id);
  }

  if (email_type) {
    where_clauses.push('email_type = ?');
    params.push(email_type);
  }

  if (related_item_copy_id) {
    where_clauses.push('related_item_copy_id = ?');
    params.push(related_item_copy_id);
  }

  const query = `UPDATE EMAIL_NOTIFICATIONS 
                 SET status = 'cancelled', updated_at = ? 
                 WHERE ${where_clauses.join(' AND ')}`;

  const result = await db.execute_query(query, [
    format_sql_datetime(new Date()),
    ...params,
  ]);
  return result.changes;
}
