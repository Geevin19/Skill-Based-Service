const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { createBooking, getMyBookings, getBooking, updateBookingStatus, rescheduleBooking } = require('../controllers/bookingController');

router.get('/', authenticate, getMyBookings);
router.get('/:id', authenticate, getBooking);
router.post('/', authenticate, createBooking);
router.put('/:id/status', authenticate, updateBookingStatus);
router.put('/:id/reschedule', authenticate, rescheduleBooking);

module.exports = router;
