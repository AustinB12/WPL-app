# Email Notification System

Complete email notification system for the Wayback Public Library management system.

## Features Implemented

### 1. **Email Queue System** (`EMAIL_NOTIFICATIONS` table)

- Priority-based queue (1-10, 1 is highest priority)
- Automatic retry logic with exponential backoff
- Status tracking: `pending`, `sent`, `failed`, `cancelled`
- Links to related entities (patrons, items, transactions, reservations, fines)
- 90-day retention for sent emails, indefinite for failed

### 2. **Background Email Worker** (`emailWorker.js`)

- Runs every 2 minutes to process pending emails
- Automatic retry with exponential backoff (5min, 10min, 20min)
- Graceful shutdown handling
- Queue statistics and monitoring

### 3. **Email Configuration** (`email.js`)

- Nodemailer integration with SMTP
- Falls back to Ethereal test account if SMTP not configured
- Supports Gmail, SendGrid, or any SMTP server

### 4. **Automated Email Types**

#### **Checkout Receipt**

- Sent when items are checked out
- Includes title, due date, copy ID
- Priority: 7 (low - informational)

#### **Checkin Receipt**

- Sent when items are returned
- Includes fine information if overdue
- Priority: 7 (low - informational)

#### **Reservation Ready**

- Sent when reserved item becomes available
- Includes 5-day pickup deadline
- Priority: 2 (high - time-sensitive)

#### **Overdue Reminder**

- Sent daily at 8 AM for overdue items
- Includes days overdue and fine amount
- Only sent once per 3 days per item
- Priority: 3 (high - important)

#### **Due Date Reminder**

- Sent daily at 9 AM for items due in 2-3 days
- Includes renewal information
- Only sent once per 5 days per item
- Priority: 5 (normal)

### 5. **Daily Overdue Checker** (`overdueChecker.js`)

- Runs at 8 AM: Check overdue items, queue reminders
- Runs at 9 AM: Check items due soon, queue reminders
- Prevents duplicate emails with cooldown periods

### 6. **Admin API Endpoints** (`/api/v1/emails`)

```
GET    /api/v1/emails                      # List emails (filter by status, type, patron)
GET    /api/v1/emails/stats                # Queue statistics
GET    /api/v1/emails/:id                  # Get single email
POST   /api/v1/emails/:id/retry            # Retry failed email
POST   /api/v1/emails/:id/cancel           # Cancel pending email
POST   /api/v1/emails/trigger-processing   # Manually trigger processing
POST   /api/v1/emails/trigger-overdue-check # Manually trigger overdue check
DELETE /api/v1/emails/:id                  # Delete email
```

## Configuration

### Environment Variables (`.env`)

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM_NAME=Wayback Public Library
EMAIL_FROM_ADDRESS=library@wayback.org
```

### Gmail Setup

1. Enable 2-Factor Authentication
2. Create App Password: https://myaccount.google.com/apppasswords
3. Use app password (not your regular password) in `SMTP_PASSWORD`

### Development (Ethereal)

If SMTP is not configured, the system automatically creates an Ethereal test account.

- View sent emails at: https://ethereal.email/messages
- Test account credentials logged on startup

## Usage Examples

### Queue Custom Email

```javascript
import { queue_email } from './services/emailService.js';

await queue_email({
  patron_id: 123,
  email_type: 'custom_notification',
  recipient_email: 'patron@example.com',
  subject: 'Custom Subject',
  body_text: 'Plain text email body',
  body_html: '<p>HTML email body</p>',
  priority: 5,
  scheduled_for: new Date(), // Send immediately
  metadata: { custom_field: 'value' },
});
```

### Check Queue Statistics

```bash
GET http://localhost:3000/api/v1/emails/stats
```

### Manually Trigger Processing

```bash
POST http://localhost:3000/api/v1/emails/trigger-processing
```

### Retry Failed Email

```bash
POST http://localhost:3000/api/v1/emails/42/retry
```

## Monitoring

### Check Logs

- Email worker logs every 2 minutes
- Overdue checker logs daily at 8 AM & 9 AM
- Success/failure counts logged after each batch

### Query Database

```sql
-- View pending emails
SELECT * FROM EMAIL_NOTIFICATIONS WHERE status = 'pending';

-- View failed emails
SELECT * FROM EMAIL_NOTIFICATIONS WHERE status = 'failed';

-- Count by status
SELECT status, COUNT(*) FROM EMAIL_NOTIFICATIONS GROUP BY status;
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Application Events (checkout, checkin, etc.)       │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  emailService.js (queue_* functions)                │
│  Queues emails to EMAIL_NOTIFICATIONS table         │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  EMAIL_NOTIFICATIONS Table (SQLite)                 │
│  Priority queue with retry logic                    │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  emailWorker.js (cron every 2 min)                  │
│  Processes pending emails, handles retries          │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  email.js (Nodemailer)                              │
│  SMTP sending via Gmail/SendGrid/Ethereal           │
└─────────────────────────────────────────────────────┘
```

## Troubleshooting

### Emails Not Sending

1. Check email worker is running: logs show "📧 Email Worker Started"
2. Check SMTP credentials in `.env`
3. View pending emails: `GET /api/v1/emails?status=pending`
4. Manually trigger: `POST /api/v1/emails/trigger-processing`

### Gmail Authentication Failed

- Enable 2FA and use App Password (not regular password)
- Check "Less secure app access" is OFF
- Use App Password from https://myaccount.google.com/apppasswords

### Too Many Emails

- Adjust cron schedules in `emailWorker.js` and `overdueChecker.js`
- Increase cooldown periods in `overdueChecker.js`
- Disable specific email types by commenting out queue calls

### Test Without Sending

- Leave SMTP unconfigured (uses Ethereal test account)
- View test emails at https://ethereal.email/messages
- Preview URL logged in console for each email

## Future Enhancements

- Email templates with library branding
- Patron email preferences (opt-in/opt-out per type)
- HTML email templates with styling
- Attachment support (e.g., PDF receipts)
- SMS notifications via Twilio
- Batch digest emails (daily summary instead of individual)
- Email delivery webhooks (open/click tracking)
