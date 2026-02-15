const express = require('express');

const { getUserNotifications,markNotificationAsRead } = require('../controllers/notificationController');

// You can protect with auth middleware if needed
const notificationRouter = express.Router();

notificationRouter.route('/my').get(getUserNotifications)
notificationRouter.route('/:notificationId/read').patch(markNotificationAsRead)

module.exports = notificationRouter;