const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { getProfile, updateProfile, switchRole, getMentors, getAvailability, setAvailability } = require('../controllers/userController');

router.get('/mentors', getMentors);
router.get('/:id', getProfile);
router.get('/:id/availability', getAvailability);
router.put('/profile', authenticate, upload.single('avatar'), updateProfile);
router.put('/switch-role', authenticate, switchRole);
router.put('/availability', authenticate, authorize('mentor'), setAvailability);

module.exports = router;
