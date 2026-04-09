const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getStats, getUsers, updateUser, approveMentor, getReports, resolveReport } = require('../controllers/adminController');

router.use(authenticate, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.put('/users/:id/approve-mentor', approveMentor);
router.get('/reports', getReports);
router.put('/reports/:id', resolveReport);

module.exports = router;
