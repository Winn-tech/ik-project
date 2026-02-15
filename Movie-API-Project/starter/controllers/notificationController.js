const Notification = require('../models/notificationSchema');
const User = require('../models/User');
const Circle = require('../models/circleschema');
const mongoose = require('mongoose');


const getUserNotifications = async (req, res) => {
  const userId = req.user.id; // assuming auth middleware
  console.log(userId)

  try {
    const notifications = await Notification.find({ recipient: userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

const markNotificationAsRead = async (req, res) => {
  const { notificationId } = req.params;
  console.log(req.params)
  const userId = req.user.id;

  try {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.read = true;
    await notification.save();

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


module.exports = { getUserNotifications,markNotificationAsRead };
