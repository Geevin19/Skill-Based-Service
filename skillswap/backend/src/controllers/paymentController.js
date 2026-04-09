const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../db');
const { createNotification } = require('../utils/notifications');

const PLATFORM_FEE_PERCENT = 0.1; // 10%

const createPaymentIntent = async (req, res) => {
  try {
    const { booking_id } = req.body;

    const booking = await db.query(
      'SELECT * FROM bookings WHERE id = $1 AND learner_id = $2',
      [booking_id, req.user.id]
    );
    if (!booking.rows[0]) return res.status(404).json({ message: 'Booking not found' });

    const b = booking.rows[0];
    const amountCents = Math.round(b.price * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      metadata: { booking_id, learner_id: req.user.id, mentor_id: b.mentor_id },
    });

    const fee = b.price * PLATFORM_FEE_PERCENT;
    await db.query(
      `INSERT INTO payments (booking_id, payer_id, payee_id, amount, platform_fee, net_amount, stripe_payment_intent_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [booking_id, req.user.id, b.mentor_id, b.price, fee, b.price - fee, paymentIntent.id]
    );

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ message: `Webhook error: ${err.message}` });
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const { booking_id, mentor_id } = pi.metadata;

    await db.query(
      `UPDATE payments SET status='completed', updated_at=NOW()
       WHERE stripe_payment_intent_id = $1`,
      [pi.id]
    );
    await db.query(
      `UPDATE bookings SET status='confirmed', updated_at=NOW() WHERE id = $1`,
      [booking_id]
    );
    await createNotification(mentor_id, 'payment', 'Payment Received',
      'A learner has paid for your session', { booking_id });
  }

  res.json({ received: true });
};

const getEarnings = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         SUM(net_amount) as total_earnings,
         COUNT(*) as total_transactions,
         SUM(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN net_amount ELSE 0 END) as monthly_earnings
       FROM payments WHERE payee_id = $1 AND status = 'completed'`,
      [req.user.id]
    );

    const transactions = await db.query(
      `SELECT p.*, b.scheduled_at, lp.name as learner_name
       FROM payments p
       LEFT JOIN bookings b ON p.booking_id = b.id
       LEFT JOIN profiles lp ON p.payer_id = lp.user_id
       WHERE p.payee_id = $1 AND p.status = 'completed'
       ORDER BY p.created_at DESC LIMIT 20`,
      [req.user.id]
    );

    res.json({ summary: result.rows[0], transactions: transactions.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createPaymentIntent, stripeWebhook, getEarnings };
