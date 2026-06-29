const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/subscriptionRequestController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// User routes
router.post('/request', authMiddleware, roleMiddleware('user'), ctrl.requestUpgrade);
router.get('/my-request', authMiddleware, roleMiddleware('user'), ctrl.getMyRequest);

// Admin routes
router.get('/all', authMiddleware, roleMiddleware('admin'), ctrl.getAllRequests);
router.post('/:id/review', authMiddleware, roleMiddleware('admin'), ctrl.reviewRequest);

module.exports = router;
