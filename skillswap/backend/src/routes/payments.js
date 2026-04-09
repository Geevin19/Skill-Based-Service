const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { createPaymentIntent, stripeWebhook, getEarnings } = require('../controllers/paymentController');

router.post('/create-intent', authenticate, createPaymentIntent);
router.post('/webhook', stripeWebhook);
router.get('/earnings', authenticate, getEarnings);

module.exports = router;
