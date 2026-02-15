const circleThread = require("../models/circleThreadSchema");
const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const Notification = require("../models/notificationSchema");


// const addThreadComment = async (req, res) => {

//   const url = req.originalUrl;
//   const id = url.split("/")[5];
//   console.log(id);
//   const userId = req.user.id;

//   const { replyText } = req.body;
//   console.log(replyText)

//   const thread = await circleThread.findById(id);
//   console.log(thread)
//   if (!thread) return res.status(404).json({ msg: "Thread not found" });

//   // Push reply using embedded schema
//   thread.comments.push({
//     uploadedBy: userId,
//     replyText: replyText,
//     likes: [],
//     dislikes: [],
//   });

//   await thread.save();


//   res.send("ok");
// };

const addThreadComment = async (req, res) => {
  const url = req.originalUrl;
  const threadId = url.split("/")[5];
  const userId = req.user.id;
  const { replyText } = req.body;

  // Find the thread
  const thread = await circleThread.findById(threadId);
  if (!thread) {
    return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Thread not found" });
  }

  // Push new comment
  thread.comments.push({
    uploadedBy: userId,
    replyText,
    likes: [],
    dislikes: [],
  });
  await thread.save();

// Mention detection and notification
const io = req.app.get('io');
const connectedUsers = req.app.get('connectedUsers');
const currentUser = await User.findById(userId); // To get username

// Detect mentions
const mentionedUsernames = replyText.match(/@(\w+)/g)?.map(name => name.slice(1)) || [];


for (const username of mentionedUsernames) {
  const recipient = await User.findOne({ username });
  if (!recipient || recipient._id.equals(userId)) continue; // Skip if user not found or self

  const notification = await Notification.create({
     type: 'mention',
    recipient: recipient._id,
    message: `${currentUser.username} mentioned you in a comment`,
    link: `/thread/${threadId}`
  });

  const socketId = connectedUsers[username];
  console.log(`my socket id is ${socketId}`)
  if (socketId) {
    io.to(socketId).emit('newNotification', notification);
  }
}

  // Populate the newly added comment’s user & reactions
  await thread.populate([
    { path: "comments.uploadedBy", select: "username profilePic" },
    { path: "comments.likes",         select: "username profilePic" },
    { path: "comments.dislikes",      select: "username profilePic" },
  ]);

  const newComment = thread.comments[thread.comments.length - 1].toObject();
  // add counts
  newComment.likesCount    = newComment.likes.length;
  newComment.dislikesCount = newComment.dislikes.length;

  // Return the populated comment
  return res.status(StatusCodes.CREATED).json({
    success: true,
    comment: newComment
  });
};


const likeComment = async (req, res) => {
  try {
    const url = req.originalUrl;
    const threadId = url.split("/")[5];
    const commentID = url.split("/")[7];
    console.log(threadId);
    console.log(commentID);
    const userId = req.user.id
    let thread = await circleThread.findById(threadId);

    const comment = thread.comments.filter(reply => reply.id == commentID)
    console.log(comment)
    //res.status(200).send('ok')
    if (!thread) return res.status(404).json({ message: "Thread not found" });
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const liked = thread.comments[0].likes.includes(userId);
    const disliked = thread.comments[0].dislikes.includes(userId);
    console.log(liked)
    if (liked) {
      thread.comments[0].likes = thread.comments[0].likes.filter(id => id.toString() !== userId);
    }

    else {
      thread.comments[0].likes.push(userId);
      // Remove from dislikes if the user had disliked before
      thread.comments[0].dislikes = thread.comments[0].dislikes.filter(id => id.toString() !== userId);
    }

    await thread.save();

    res.status(200).json({
      message: liked ? "Like removed" : "Thread Comment liked",
      likesCount: thread.comments[0].likes.length,
      dislikesCount: thread.comments[0].dislikes.length
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });

  }
};

const dislikeComment = async (req, res) => {
  try {
    const url = req.originalUrl;
    const threadId = url.split("/")[5];
    const commentID = url.split("/")[7];
    console.log(threadId);
    console.log(commentID);
    const userId = req.user.id
    let thread = await circleThread.findById(threadId);

    const comment = thread.comments.filter(reply => reply.id == commentID)
    console.log(comment)

    if (!thread) return res.status(404).json({ message: "Thread not found" });
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const liked = thread.comments[0].likes.includes(userId);
    const disliked = thread.comments[0].dislikes.includes(userId);
    if (disliked) {
      thread.comments[0].dislikes = thread.comments[0].dislikes.filter(id => id.toString() !== userId);
    } else {
      thread.comments[0].dislikes.push(userId);
      // Remove from likes if the user had liked before
      thread.comments[0].likes = thread.comments[0].likes.filter(id => id.toString() !== userId);
    }

    await thread.save();

    res.status(200).json({
      message: disliked ? "Dislike removed" : "Thread comments disliked",
      likesCount: thread.comments[0].likes.length,
      dislikesCount: thread.comments[0].dislikes.length
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = { addThreadComment, likeComment, dislikeComment };