const mongoose = require("mongoose");
const User = require("../models/User");
const circle = require("../models/circleschema");
const { StatusCodes } = require("http-status-codes");
const Notification = require("../models/notificationSchema")

const createCircle = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;

    const addCircle = await circle.create(req.body);

    res.json({ msg: "Circle created sucessfully", data: addCircle });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// const joinCircle = async (req, res) => {
//   const { circleId } = req.params;
//   console.log(typeof circleId);

//   const circlejoin = await circle.findById(circleId);
//   circlejoin.members.push(req.user.id);

//   await circlejoin.save();

//   res.json(circlejoin);
// };

// const joinCircle = async (req, res) => {
//   const { circleId } = req.params;
//   console.log(typeof circleId);

//   const circlejoin = await circle.findById(circleId);

//   if (!circlejoin) {
//     return res.status(404).json({ message: "Circle not found" });
//   }

//   if (!circlejoin.members.includes(req.user.id)) {
//     circlejoin.members.push(req.user.id);
//     await circlejoin.save();
//     return res.json({
//       message: "Joined circle successfully",
//       data: circlejoin,
//     });
//   } else {
//     return res
//       .status(200)
//       .json({ message: "Already a member", data: circlejoin });
//   }
// };

const joinCircle = async (req, res) => {
  try {
    const { circleId } = req.params;
    const userId = req.user.id;
    console.log(req.user.user)
    // 1. Validate circle exists
    const circleToJoin = await circle.findById(circleId);
    console.log(circleToJoin)
    if (!circleToJoin) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        success: false,
        message: "Circle not found" 
      });
    }

    // 2. Get user details for validation
    const user = await User.findById(userId);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // 3. Check if username is already in circle (case-insensitive)
    const existingMember = await circle.findOne({
      _id: circleId,
      $or: [
        { 'members': userId },
        { 
          'members': { 
            $in: await User.find({ 
              username: new RegExp(`^${user.username}$`, 'i') 
            }).distinct('_id') 
          } 
        }
      ]
    }).populate('members', 'username');

    if (existingMember) {
      // Find the conflicting user for better error message
      const conflictUser = existingMember.members.find(m => 
        m.username.toLowerCase() === user.username.toLowerCase()
      );
      
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: conflictUser && conflictUser._id.equals(userId) 
          ? "You are already a member of this circle" 
          : `Username '${user.username}' is already taken in this circle`
      });
    }
     console.log(`[JOIN] User ${userId} attempting to join circle "${circleToJoin.name}"`);
    // 4. Add user to circle
    circleToJoin.members.push(userId);
    await circleToJoin.save();
      console.log(`[JOIN] User ${userId} added to circle "${circleToJoin.name}"`);
      // Notify circle owner
  const notification = new Notification({
    type: 'circle_join',
    message: `${req.user.user} joined your circle ${circleToJoin.name}`,
    recipient: circleToJoin.createdBy,
    sender: req.user.user,
    circle: circleToJoin._id
  });
  await notification.save();
 console.log(` Notification created:`, notification);
 console.log(req.user.user)
  // Emit via Socket.IO
  const io = req.app.get('io');
// 1. Get the map of online users
const connectedUsers = req.app.get('connectedUsers');

// 2. Get the circle owner's user document (you need the username)
const circleOwner = await User.findById(circleToJoin.createdBy);

// 3. Get their socket ID by username
const recipientSocket = connectedUsers[circleOwner.username];




  if (recipientSocket) {
    io.to(recipientSocket).emit('new_notification', notification);
  }

    // 5. Return success with populated data
    const populatedCircle = await circle.findById(circleId)
      .populate('createdBy', 'username profilePic')
      .populate('members', 'username profilePic')
      .populate('moderators', 'username profilePic');

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Joined circle successfully",
      data: populatedCircle
    });

  } catch (error) {
    console.error("Error joining circle:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to join circle",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const leaveCircle = async (req, res) => {
  const { circleId } = req.params;
  console.log(typeof circleId);

  let circlejoin = await circle.findById(circleId);
  circlejoin.members = circlejoin.members.filter(
    (circle) => circle != req.user.id
  );

  await circlejoin.save();

  res.json(circlejoin);
};

// const getAllCircle = async (req, res) => {
//   try {
//     const thread = await circle.find();
//     if (thread.length === 0) {
//       res.send("There are no threads", StatusCodes.NO_CONTENT);
//     }

//     res.json({ data: thread, count: thread.length });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };

const getAllCircle = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || '-createdAt'; // Default: newest first

    const circles = await circle.find()
      .populate('createdBy', 'username profilePic')
      .populate('members', 'username profilePic')
      .populate('moderators', 'username profilePic')
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await circle.countDocuments();

    res.json({ 
      data: circles, 
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// const getSingleCircle = async (req, res) => {
//   try {
//     const { circleId } = req.params;
//     const thread = await circle.findById(circleId);
//     if (!thread) {
//       res.send("Circle does not exist", StatusCodes.NOT_FOUND);
//     }
//     console.log(thread);
//     res.json(thread);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };

const getSingleCircle = async (req, res) => {
  try {
    const { circleId } = req.params;
    const foundCircle = await circle.findById(circleId)
      .populate('createdBy', 'username profilePic')
      .populate('members', 'username profilePic')
      .populate('moderators', 'username profilePic');
    
    if (!foundCircle) {
      return res.status(StatusCodes.NOT_FOUND).send("Circle does not exist");
    }

    res.json(foundCircle);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const deleteCircle = async (req, res) => {
  try {
    const { circleId } = req.params;
    const thread = await circle.findByIdAndDelete(circleId);
    if (!thread) {
      res.send("Circle does not exist", StatusCodes.NOT_FOUND);
    }
    console.log(thread);

    res.json(thread);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const getCircleStatus = async (req, res) => {
  const { circleId } = req.params;
  const userId = req.user.id;

  const circleDoc = await circle.findById(circleId).select('members moderators createdBy');
  if (!circleDoc) {
    return res.status(404).json({ message: 'Circle not found' });
  }

  const isMember    = circleDoc.members.some(m => m.equals(userId));
  const isModerator = circleDoc.moderators.some(m => m.equals(userId));
  const isCreator   = circleDoc.createdBy.equals(userId);

  res.json({ isMember, isModerator, isCreator });
};
module.exports = {
  createCircle,
  joinCircle,
  leaveCircle,
  getAllCircle,
  getSingleCircle,
  deleteCircle,
  getCircleStatus
};
