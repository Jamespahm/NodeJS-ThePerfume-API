const express = require('express');
const router = express.Router();

const notificationController = require('../app/controllers/NotificationController');

router.put('/:id/read', notificationController.markAsRead);
router.delete('/:id/delete', notificationController.deleteNotification);
router.get('/unread', notificationController.getUnreadNotifications);
router.get('/', notificationController.getAllNotifications);

module.exports = router;
