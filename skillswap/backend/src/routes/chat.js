const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { getConversations, getMessages, sendMessage } = require('../controllers/chatController');

router.get('/conversations', authenticate, getConversations);
router.get('/:userId', authenticate, getMessages);
router.post('/', authenticate, upload.single('file'), sendMessage);

module.exports = router;
