const Notification = require('../models/notificationSchema');
const Circle = require('../models/circleschema');

const notifyCircleOwner = async ({ circleId, senderId, type, message, link, req }) => {
  try {
    const circle = await Circle.findById(circleId).populate('createdBy', 'username');
    console.log(circle)
   // console.log(circle.createdBy._id)

    if (!circle || circle.createdBy._id.toString() === senderId.toString()) {
      return; // Don't notify if circle doesn't exist or sender is the owner
    }

    const notification = new Notification({
      type, 
      message,
      link,
      recipient: circle.createdBy._id,
      sender: req.user.user,
      circle,
     
      
     
});
 console.log(notification)
    await notification.save();

    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    console.log(`this is the answer ${circle.createdBy.username}`)
    const recipientSocketId = connectedUsers[username];

    if (recipientSocketId) {
      io.to(recipientSocketId).emit('new_notification', notification);
    }

  } catch (err) {
    console.error("Failed to notify circle owner:", err.message);
  }
};

module.exports = {notifyCircleOwner};
