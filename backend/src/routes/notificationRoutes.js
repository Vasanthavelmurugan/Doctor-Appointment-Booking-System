const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyAuth } = require('../middleware/auth');

router.get('/', verifyAuth, notificationController.getMyNotifications);
router.put('/:id/read', verifyAuth, notificationController.markAsRead);
router.post('/check-reminders', verifyAuth, notificationController.triggerReminderCheck);

module.exports = router;
