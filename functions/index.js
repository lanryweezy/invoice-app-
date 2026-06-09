const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();

// IMPORTANT: Secret is now injected via runWith secrets config
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

exports.paystackWebhook = functions.runWith({ secrets: ["PAYSTACK_SECRET_KEY"] }).https.onRequest(async (req, res) => {
    // 1. Verify the signature
    if (!PAYSTACK_SECRET_KEY) {
        console.error("PAYSTACK_SECRET_KEY not set");
        return res.status(500).send('Configuration error');
    }
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(JSON.stringify(req.body)).digest('hex');
    if (hash !== req.headers['x-paystack-signature']) {
        return res.status(401).send('Invalid signature');
    }

    // 2. Process the event
    const event = req.body;
    if (event.event === 'charge.success') {
        const uid = event.data.metadata.uid;
        
        // 3. Update Firestore securely
        await admin.firestore().collection('users').doc(uid).set({ plan: 'pro' }, { merge: true });
        return res.status(200).send('OK');
    }

    res.status(200).send('Event ignored');
});
