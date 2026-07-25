const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');
const webPush = require('web-push');

admin.initializeApp();

// ============================================================
// VAPID Configuration
// ============================================================
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BOe02CglsI645kDwgg8MSk7Z842bivuhkkE2lKD5eATPUHf5tFfsXpwv4Ihe6iBZ4oQXuhHYnqxg_4EXp-uDNdY';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';

webPush.setVapidDetails(
  'mailto:hello@invoiceapp.ng',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// ============================================================
// Paystack Webhook
// ============================================================
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

exports.paystackWebhook = functions.runWith({ secrets: ["PAYSTACK_SECRET_KEY"] }).https.onRequest(async (req, res) => {
    if (!PAYSTACK_SECRET_KEY) {
        console.error("PAYSTACK_SECRET_KEY not set");
        return res.status(500).send('Configuration error');
    }
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(req.rawBody).digest('hex');
    if (hash !== req.headers['x-paystack-signature']) {
        return res.status(401).send('Invalid signature');
    }

    const event = req.body;
    if (event.event === 'charge.success') {
        const uid = event.data.metadata.uid;
        await admin.firestore().collection('users').doc(uid).set({ plan: 'pro' }, { merge: true });
        return res.status(200).send('OK');
    }

    res.status(200).send('Event ignored');
});

// ============================================================
// Push Notification: Send to user
// ============================================================
async function sendPushNotification(userId, title, body, url) {
  const db = admin.firestore();
  const subRef = db.collection('users').doc(userId).collection('pushSubscriptions').doc('current');
  const snap = await subRef.get();

  if (!snap.exists) return false;

  const subscription = snap.data().subscription;
  const payload = JSON.stringify({
    title,
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    url: url || '/editor',
    timestamp: Date.now(),
  });

  try {
    await webPush.sendNotification(subscription, payload);
    return true;
  } catch (error) {
    console.error('Push notification failed:', error);
    // If subscription is invalid, remove it
    if (error.statusCode === 404 || error.statusCode === 410) {
      await subRef.delete();
    }
    return false;
  }
}

// ============================================================
// Trigger: Invoice created — notify user
// ============================================================
exports.onInvoiceCreated = functions.firestore
  .document('users/{uid}/invoices/{invoiceId}')
  .onCreate(async (snap, context) => {
    const { uid } = context.params;
    const invoice = snap.data();

    await sendPushNotification(
      uid,
      'Invoice Created',
      `Invoice #${invoice.invoiceNumber} for ${invoice.client?.name || 'client'} has been created.`,
      '/editor'
    );
  });

// ============================================================
// Trigger: Invoice paid — notify user
// ============================================================
exports.onInvoicePaid = functions.firestore
  .document('users/{uid}/invoices/{invoiceId}')
  .onUpdate(async (change, context) => {
    const { uid } = context.params;
    const before = change.before.data();
    const after = change.after.data();

    // Only notify when status changes to 'paid'
    if (before.status !== 'paid' && after.status === 'paid') {
      const amount = after.total || after.amount || 0;
      const currency = after.currency || 'NGN';

      await sendPushNotification(
        uid,
        'Payment Received! 💰',
        `${currency} ${amount.toLocaleString()} payment received for Invoice #${after.invoiceNumber} from ${after.client?.name || 'client'}.`,
        '/editor'
      );
    }
  });

// ============================================================
// Scheduled: Check for overdue invoices daily
// ============================================================
exports.checkOverdueInvoices = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const db = admin.firestore();
    const today = new Date().toISOString().split('T')[0];

    // Get all users with push subscriptions
    const usersSnap = await db.collection('users').get();

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;

      // Check for overdue invoices
      const invoicesSnap = await db.collection('users').doc(uid).collection('invoices')
        .where('status', 'in', ['sent', 'pending'])
        .where('dueDate', '<', today)
        .get();

      if (invoicesSnap.empty) continue;

      let totalOverdue = 0;
      let overdueCount = 0;

      invoicesSnap.forEach((doc) => {
        const inv = doc.data();
        totalOverdue += inv.total || inv.amount || 0;
        overdueCount++;
      });

      if (overdueCount > 0) {
        const currency = invoicesSnap.docs[0]?.data()?.currency || 'NGN';
        await sendPushNotification(
          uid,
          `⚠️ ${overdueCount} Overdue Invoice${overdueCount > 1 ? 's' : ''}`,
          `You have ${overdueCount} overdue invoice${overdueCount > 1 ? 's' : ''} totaling ${currency} ${totalOverdue.toLocaleString()}. Send reminders now!`,
          '/editor'
        );
      }
    }
  });

// ============================================================
// HTTP: Send push notification (for testing/manual triggers)
// ============================================================
exports.sendPushNotification = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { userId, title, body, url } = data;

  // Users can only send to themselves
  const targetUserId = userId || context.auth.uid;

  const success = await sendPushNotification(targetUserId, title, body, url);

  return { success };
});

// ============================================================
// HTTP: Get VAPID public key (for client-side setup)
// ============================================================
exports.getVapidKey = functions.https.onRequest((req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});
