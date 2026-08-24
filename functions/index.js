const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();

// ============================================================
// Paystack Webhook
// ============================================================
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Resolve the Firebase uid from a Paystack event payload.
// Prefers the top-level metadata.uid, falling back to the custom_fields array.
function resolveUid(data) {
    const meta = (data && data.metadata) || {};
    if (meta.uid) return meta.uid;
    const fields = Array.isArray(meta.custom_fields) ? meta.custom_fields : [];
    const field = fields.find(f => f && (f.variable_name === 'uid' || f.variable_name === 'user_id'));
    return field ? field.value : null;
}

// Reverse-lookup a uid from a Paystack customer code (used by refund/cancellation events
// that don't carry our metadata).
async function uidFromCustomer(db, data) {
    const code = data && data.customer && data.customer.customer_code;
    if (!code) return null;
    const snap = await db.collection('paystackCustomers').doc(code).get();
    return snap.exists ? snap.data().uid : null;
}

// Independently confirm a transaction with Paystack's API — never trust the webhook body alone.
async function verifyTransaction(reference) {
    // 🌱 Flora: Add timeout to prevent the external Paystack API call from hanging indefinitely
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        const resp = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
            signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!resp.ok) return null;
        const json = await resp.json();
        return json && json.status ? json.data : null;
    } catch (err) {
        clearTimeout(timeout);
        console.error('Paystack verify call failed', { reference, error: err.message });
        return null; // Safe fallback: returns null, allowing the webhook to either retry or fail safely
    }
}

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
    const data = event.data || {};
    const reference = data.reference ? String(data.reference) : (data.id ? String(data.id) : null);
    const db = admin.firestore();

    // Idempotency: skip events we've already fully processed (handles Paystack retries/replays).
    const dedupeRef = reference
        ? db.collection('processedWebhooks').doc(`${event.event}_${reference}`.replace(/[/]/g, '_'))
        : null;
    if (dedupeRef) {
        const seen = await dedupeRef.get();
        if (seen.exists) {
            return res.status(200).send('Duplicate ignored');
        }
    }

    try {
        switch (event.event) {
            case 'charge.success': {
                const uid = resolveUid(data);
                if (!uid) {
                    console.error('charge.success missing uid', { reference });
                    return res.status(200).send('No uid');
                }
                // Re-verify against Paystack before granting Pro.
                const verified = await verifyTransaction(reference);
                if (!verified || verified.status !== 'success') {
                    console.error('Transaction verification failed', { reference });
                    return res.status(200).send('Unverified');
                }
                const customerCode = data.customer && data.customer.customer_code;
                await db.collection('users').doc(uid).set({
                    plan: 'pro',
                    paystackRef: reference,
                    paystackCustomerCode: customerCode || null,
                }, { merge: true });
                // Store the reverse mapping so future refund/cancellation events can find this user.
                if (customerCode) {
                    await db.collection('paystackCustomers').doc(customerCode).set({ uid }, { merge: true });
                }
                break;
            }
            case 'charge.refunded':
            case 'refund.processed': {
                const uid = resolveUid(data) || await uidFromCustomer(db, data);
                if (uid) {
                    await db.collection('users').doc(uid).set({ plan: 'free' }, { merge: true });
                }
                break;
            }
            case 'subscription.disable':
            case 'subscription.not_renew':
            case 'invoice.payment_failed': {
                const uid = await uidFromCustomer(db, data);
                if (uid) {
                    await db.collection('users').doc(uid).set({ plan: 'free' }, { merge: true });
                }
                break;
            }
            default:
                return res.status(200).send('Event ignored');
        }

        // Mark processed only after successful handling so genuine failures can be retried by Paystack.
        if (dedupeRef) {
            await dedupeRef.set({
                event: event.event,
                reference,
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        return res.status(200).send('OK');
    } catch (err) {
        console.error('Webhook processing error', { event: event.event, reference, error: err.message });
        // Return 5xx (no dedupe write) so Paystack retries delivery.
        return res.status(500).send('Processing error');
    }
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

    const invoicesSnap = await db.collectionGroup('invoices')
      .where('status', 'in', ['sent', 'pending'])
      .where('dueDate', '<', today)
      .get();

    if (invoicesSnap.empty) return;

    const overdueByUser = {};

    invoicesSnap.forEach((doc) => {
      const inv = doc.data();
      const uid = doc.ref.parent.parent.id;

      if (!overdueByUser[uid]) {
        overdueByUser[uid] = {
          count: 0,
          total: 0,
          currency: inv.currency || 'NGN'
        };
      }

      overdueByUser[uid].count++;
      overdueByUser[uid].total += (inv.total || inv.amount || 0);
    });

    const entries = Object.entries(overdueByUser);
    const chunkSize = 10;

    for (let i = 0; i < entries.length; i += chunkSize) {
      const chunk = entries.slice(i, i + chunkSize);

      // 🌱 Flora: Replace Promise.all with Promise.allSettled so a single failure doesn't drop the rest of the chunk
      const results = await Promise.allSettled(
        chunk.map(async ([uid, stats]) => {
          if (stats.count > 0) {
            await sendPushNotification(
              uid,
              `⚠️ ${stats.count} Overdue Invoice${stats.count > 1 ? 's' : ''}`,
              `You have ${stats.count} overdue invoice${stats.count > 1 ? 's' : ''} totaling ${stats.currency} ${stats.total.toLocaleString()}. Send reminders now!`,
              '/editor'
            );
          }
        })
      );

      results.forEach(result => {
        if (result.status === 'rejected') {
          console.error('Push notification failed for overdue invoice chunk', result.reason);
        }
      });

      // Rate-limiting pause between chunks
      if (i + chunkSize < entries.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
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

  // Security Enhancement: Prevent IDOR by ensuring user can only send notifications to themselves
  if (userId && userId !== context.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'Cannot send push notification to other users');
  }

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
