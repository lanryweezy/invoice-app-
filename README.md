# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key
3. Run the app:
   `npm run dev`

## Commercialization Notes
- **Firebase Auth & Firestore:** The application uses Firebase to handle Pro user subscriptions and data syncing. For development, mock API keys are used in `services/firebase.ts`.
- **Paystack:** Paystack inline payments are integrated for the Pro upgrade flow. A mock public key is used.
- **Security:** Client-side updates to `{ plan: 'pro' }` are a placeholder for this MVP. A `functions/` directory stub is provided for server-side verification via Paystack webhooks.
