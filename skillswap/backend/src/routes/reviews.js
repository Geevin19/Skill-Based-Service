const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { createReview, getMentorReviews } = require('../controllers/reviewController');

router.get('/mentor/:id', getMentorReviews);
router.post('/', authenticate, createReview);

module.exports = router;
