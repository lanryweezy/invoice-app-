const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();

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
    const signature = req.headers['x-paystack-signature'] || '';

    const hashBuffer = Buffer.from(hash, 'hex');
    const signatureBuffer = Buffer.from(signature, 'hex');

    // Security enhancement: Prevent timing attacks when verifying signatures
    if (hashBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(hashBuffer, signatureBuffer)) {
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
// Push Notification: Send to user via FCM
// ============================================================
async function sendPushNotification(userId, title, body, url) {
  const db = admin.firestore();
  const subRef = db.collection('users').doc(userId).collection('fcmTokens').doc('current');
  const snap = await subRef.get();

  if (!snap.exists) return false;

  const token = snap.data().token;
  if (!token) return false;

  const message = {
    token,
    notification: { title, body },
    webpush: {
      notification: {
        title,
        body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        vibrate: [200, 100, 200],
      },
      fcmOptions: { link: url || '/editor' },
    },
  };

  try {
    await admin.messaging().send(message);
    return true;
  } catch (error) {
    console.error('Push notification failed', {
      event: 'push.send.failed',
      userId,
      errorCode: error.code,
      errorMessage: error.message
    });
    if (error.code === 'messaging/registration-token-not-registered') {
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

    const usersSnap = await db.collection('users').get();

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;

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
// HTTP: Send push notification (callable)
// ============================================================
exports.sendPushNotification = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { userId, title, body, url } = data;
  const targetUserId = userId || context.auth.uid;

  const success = await sendPushNotification(targetUserId, title, body, url);
  return { success };
});

// ============================================================
// HTTP: Save FCM token (callable)
// ============================================================
exports.saveFcmToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { token } = data;
  const uid = context.auth.uid;

  await admin.firestore().collection('users').doc(uid).collection('fcmTokens').doc('current').set({
    token,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    userAgent: data.userAgent || '',
  });

  return { success: true };
});
