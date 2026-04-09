const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { signup, login, verifyEmail, forgotPassword, resetPassword, getMe } = require('../controllers/authController');

router.post('/signup',
  [body('email').isEmail(), body('password').isLength({ min: 6 }), body('name').notEmpty()],
  validate, signup
);
router.post('/login',
  [body('email').isEmail(), body('password').notEmpty()],
  validate, login
);
router.get('/verify-email', verifyEmail);
router.post('/forgot-password', [body('email').isEmail()], validate, forgotPassword);
router.post('/reset-password',
  [body('token').notEmpty(), body('password').isLength({ min: 6 })],
  validate, resetPassword
);
router.get('/me', authenticate, getMe);

module.exports = router;
