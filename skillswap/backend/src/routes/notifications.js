const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getNotifications, markRead, markAllRead, createReport } = require('../controllers/notificationController');

router.get('/', authenticate, getNotifications);
router.put('/read', authenticate, markRead);
router.put('/read-all', authenticate, markAllRead);
router.post('/report', authenticate, createReport);

module.exports = router;
