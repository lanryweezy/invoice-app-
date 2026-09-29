# INVOICEAPP.NG - AI Strategy

## 1. AI Invoice Assistant
"Create an invoice for Acme for ₦2.5m for website development."
- Uses LLM (e.g. OpenAI structured output) to map natural language to a draft JSON payload.
- Asks clarifying questions if missing `clientName`, `amount`, or `service description`.

## 2. AI Collections Assistant
"Who owes me money?"
- LLM translates query to Firestore parameters or calls an API tool `getAccountsReceivable()`.
- Reads structured data back to the user in a summarized response.

## 3. Strict Guardrails
- LLMs **must not** invent financial data. They are strictly query routers and UI layer interpreters.
- Operations like sending emails/reminders must be explicitly confirmed by the user.
