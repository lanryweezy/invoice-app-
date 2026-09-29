# INVOICEAPP.NG - Collections Automation

## Concept
Automate the A/R (Accounts Receivable) process without spamming customers.

## Workflow Example
1. Invoice Sent
2. 3 days before due: Pre-due Reminder.
3. Due date: Payment Reminder.
4. 3 days overdue: Gentle Reminder.
5. 7 days overdue: Standard Reminder.
6. 14 days overdue: Escalation Warning.

## Data Model Needed
`AutomationSchedule`:
- `invoice_id`
- `status` (PENDING, SENT, CANCELLED)
- `scheduled_for`
- `template_type`

## Required Workers
A CRON job (e.g., Firebase Scheduled Function) that runs daily, queries `AutomationSchedule` where `scheduled_for <= NOW()` and `invoice.status != PAID`, dispatches the notification, and marks the schedule as `SENT`.
