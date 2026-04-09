const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { supabase } = require('../db');
const { createNotification } = require('../utils/notifications');

const PLATFORM_FEE = 0.1;

const createPaymentIntent = async (req, res) => {
  try {
    const { booking_id } = req.body;
    const { data: booking } = await supabase.from('bookings').select('*').eq('id', booking_id).eq('learner_id', req.user.id).single();
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const amountCents = Math.round(booking.price * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents, currency: 'usd',
      metadata: { booking_id, learner_id: req.user.id, mentor_id: booking.mentor_id },
    });

    const fee = booking.price * PLATFORM_FEE;
    await supabase.from('payments').insert({
      booking_id, payer_id: req.user.id, payee_id: booking.mentor_id,
      amount: booking.price, platform_fee: fee, net_amount: booking.price - fee,
      stripe_payment_intent_id: paymentIntent.id,
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const stripeWebhook = async (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ message: `Webhook error: ${err.message}` });
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const { booking_id, mentor_id } = pi.metadata;
    await supabase.from('payments').update({ status: 'completed' }).eq('stripe_payment_intent_id', pi.id);
    await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', booking_id);
    await createNotification(mentor_id, 'payment', 'Payment Received', 'A learner has paid for your session', { booking_id });
  }

  res.json({ received: true });
};

const getEarnings = async (req, res) => {
  try {
    const { data: payments } = await supabase.from('payments')
      .select('*, bookings(scheduled_at), payer:profiles!payments_payer_id_fkey(name)')
      .eq('payee_id', req.user.id).eq('status', 'completed')
      .order('created_at', { ascending: false });

    const total = (payments || []).reduce((s, p) => s + parseFloat(p.net_amount), 0);
    const monthly = (payments || []).filter(p => new Date(p.created_at) > new Date(Date.now() - 30 * 86400000))
      .reduce((s, p) => s + parseFloat(p.net_amount), 0);

    res.json({
      summary: { total_earnings: total, monthly_earnings: monthly, total_transactions: payments?.length || 0 },
      transactions: (payments || []).slice(0, 20).map(p => ({ ...p, learner_name: p.payer?.name, scheduled_at: p.bookings?.scheduled_at })),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createPaymentIntent, stripeWebhook, getEarnings };
