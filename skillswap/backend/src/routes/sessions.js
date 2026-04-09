const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { createSession, getSessions, getSession, updateSession, deleteSession } = require('../controllers/sessionController');

router.get('/', getSessions);
router.get('/:id', getSession);
router.post('/', authenticate, authorize('mentor'), createSession);
router.put('/:id', authenticate, authorize('mentor'), updateSession);
router.delete('/:id', authenticate, authorize('mentor'), deleteSession);

module.exports = router;
