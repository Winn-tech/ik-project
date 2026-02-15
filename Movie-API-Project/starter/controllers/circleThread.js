
const mongoose = require("mongoose");
const User = require("../models/User");
const circle = require("../models/circleschema");
const circleThread = require("../models/circleThreadSchema");
const { StatusCodes } = require("http-status-codes");
const rateLimit = require('express-rate-limit');
const {notifyCircleOwner} = require('../utils/notifyCircleOwner')

// Rate limiter for search endpoints
const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many search requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false
});



const getAllDiscussions = async (req, res) => {
  try {
    const { circleId } = req.params;
    const page   = parseInt(req.query.page)   || 1;
    const limit  = parseInt(req.query.limit)  || 10;
    const sortBy = req.query.sortBy            || "-createdAt";

    // Fetch & populate threads + comment authors
    const discussions = await circleThread.find({
      circleId,
      type: 'discussion'
    })
      .populate('createdBy', 'username profilePic')
      .populate('likes',    'username profilePic')
      .populate('dislikes', 'username profilePic')
      .populate({
        path: 'comments.uploadedBy',
        select: 'username profilePic'
      })
      // if you also want each comment’s reactions populated:
      // .populate({ path: 'comments.likes',    select: 'username profilePic' })
      // .populate({ path: 'comments.dislikes', select: 'username profilePic' })
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit);

    // Total count
    const total = await circleThread.countDocuments({
      circleId,
      type: 'discussion'
    });

    // Shape each thread & comment
    const data = discussions.map(threadDoc => {
      const thread = threadDoc.toObject();
      thread.likesCount    = thread.likes?.length    || 0;
      thread.dislikesCount = thread.dislikes?.length || 0;

      thread.comments = (thread.comments || []).map(c => ({
        _id:           c._id,
        replyText:     c.replyText,
        uploadedBy:    c.uploadedBy,                  // now has username+profilePic
        likesCount:    c.likes?.length    || 0,
        dislikesCount: c.dislikes?.length || 0,
        uploadedAt:    c.uploadedAt
      }));

      return thread;
    });

    // Send paginated response
    return res.status(200).json({
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("getAllDiscussions error:", err);
    return res.status(500).json({ error: "Failed to get discussions" });
  }
};

// Search discussions in a circle
const searchDiscussions = async (req, res) => {
  try {
    const { circleId } = req.params;
    const { query } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const discussions = await circleThread.find({
      circleId,
      type: 'discussion',
      $or: [
        { 'content.title': { $regex: query, $options: 'i' } },
        { 'content.body': { $regex: query, $options: 'i' } }
      ]
    })
      .populate('createdBy', 'username profilePic')
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await circleThread.countDocuments({
      circleId,
      type: 'discussion',
      $or: [
        { 'content.title': { $regex: query, $options: 'i' } },
        { 'content.body': { $regex: query, $options: 'i' } }
      ]
    });

    res.status(200).json({
      data: discussions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to search discussions" });
  }
};

// const createPoll = async (req, res) => {
//   try {
//     const { circleId } = req.params;
//     req.body.createdBy = req.user.id;
//     req.body.circleId = circleId;

//     console.log(circleId);

//     const thread = await circleThread.create(req.body);

//     res.status(200).json(thread);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to create poll thread" });
//   }
// };

const createPoll = async (req, res) => {
  try {
    const { circleId } = req.params;
    // Destructure the incoming question and raw options
    const { question, options: rawOptions } = req.body.content;

    // Attach metadata
    req.body.createdBy = req.user.id;
    req.body.circleId  = circleId;
    const senderId = req.user.id
    console.log(senderId)

    // Initialize content with defaults
    req.body.content = {
      question,
      options: rawOptions.map(opt => ({
        text: opt.text,
        votes: 0
      })),
      votedUsers: []
    };
     const Circle = await circle.findById(circleId);

    // Create the thread
    const thread = await circleThread.create(req.body);

    await notifyCircleOwner({
  
  type: 'new_thread', // or 'new_discussion', 'new_recommendation'
  message: `${req.user.user} started a new poll in your circle ${Circle.name}`,
  link: `/circles/${circleId}`,
  circleId,
  senderId,
  req
  
});




    // Return the newly created poll
    res.status(201).json(thread);
  } catch (error) {
    console.error("createPoll error:", error);
    res.status(500).json({ error: "Failed to create poll thread" });
  }
};

const votePoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const voteText = req.body.text;

    // Find the poll thread
    const pollDoc = await circleThread.findById(pollId);
    if (!pollDoc) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "Poll not found" });
    }

    // Ensure content and its arrays exist
    pollDoc.content = pollDoc.content || {};
    pollDoc.content.votedUsers = Array.isArray(pollDoc.content.votedUsers)
      ? pollDoc.content.votedUsers
      : [];
    pollDoc.content.options = Array.isArray(pollDoc.content.options)
      ? pollDoc.content.options
      : [];

    // Prevent double‐voting
    if (pollDoc.content.votedUsers.includes(req.user.id)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "You have already voted" });
    }

    // Locate the selected option
    const option = pollDoc.content.options.find(
      (opt) => opt.text === voteText
    );
    if (!option) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Option not found" });
    }

    // Register the vote
    option.votes += 1;
    pollDoc.content.votedUsers.push(req.user.id);
    pollDoc.markModified("content");
    await pollDoc.save();

    // Fetch the updated thread with full population
    const updated = await circleThread
      .findById(pollId)
      .populate("createdBy", "username profilePic")
      .populate("content.votedUsers", "username profilePic")
      .populate("comments.uploadedBy", "username profilePic");

    // Shape the response
    const thread = updated.toObject();
    thread.likesCount = thread.likes.length;
    thread.dislikesCount = thread.dislikes.length;
    thread.comments = thread.comments.map((c) => ({
      _id: c._id,
      replyText: c.replyText,
      uploadedBy: c.uploadedBy,
      likesCount: c.likes.length,
      dislikesCount: c.dislikes.length,
      uploadedAt: c.uploadedAt,
    }));

    // Send back the full thread
    res.status(StatusCodes.OK).json(thread);

  } catch (err) {
    console.error("votePoll error:", err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to vote" });
  }
};
// const votePoll = async (req, res) => {
//   try {
//     const { pollId } = req.params;
//     console.log(pollId);
//     const voteText = req.body.text;

//     console.log(voteText);

//     const circle = await circleThread.findById(pollId);
//     console.log(circle.content.options);
//     const pollThread = circle.content.options.find(
//       (opt) => opt.text === voteText
//     );
//     console.log(pollThread);
//     if (circle.content.votedUsers.includes(req.user.id)) {
//       return res.status(400).json({ error: "You have already voted" });
//     }
//     circle.content.votedUsers.push(req.user.id);
//     pollThread.votes += 1;
//     circle.markModified("content");
//     await circle.save();
//     res.status(200).json(circle.content.options);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to vote" });
//   }
// };

const likeThread = async (req, res) => {
  try {
    const url = req.originalUrl;
    const id = url.split("/")[5];
    console.log(id);
    const userId = req.user.id;

    const thread = await circleThread.findById(id);
    console.log(thread);

    const liked = thread.likes.includes(userId);
    const disliked = thread.dislikes.includes(userId);

    if (liked) {
      thread.likes = thread.likes.filter((id) => id.toString() !== userId);
    } else {
      thread.likes.push(userId);
      // Remove from dislikes if the user had disliked before
      thread.dislikes = thread.dislikes.filter(
        (id) => id.toString() !== userId
      );
    }

    await thread.save();

    res.status(200).json({
      message: liked ? "Like removed" : "Review liked",
      likesCount: thread.likes.length,
      dislikesCount: thread.dislikes.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const dislikeThread = async (req, res) => {
  try {
    const url = req.originalUrl;
    const id = url.split("/")[5];
    console.log(id);
    const userId = req.user.id;

    const thread = await circleThread.findById(id);
    if (!thread) return res.status(404).json({ message: " Thread not found" });

    const liked = thread.likes.includes(userId);
    const disliked = thread.dislikes.includes(userId);

    if (disliked) {
      thread.dislikes = thread.dislikes.filter(
        (id) => id.toString() !== userId
      );
    } else {
      thread.dislikes.push(userId);
      // Remove from likes if the user had liked before
      thread.likes = thread.likes.filter((id) => id.toString() !== userId);
    }

    await thread.save();

    res.status(200).json({
      message: disliked ? "Dislike removed" : "Review disliked",
      likesCount: thread.likes.length,
      dislikesCount: thread.dislikes.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};




const getPollResult = async (req, res) => {
  try {
    const { pollId } = req.params;

    // Fetch the poll with its creator and any comments (you may already have this)
    const pollDoc = await circleThread.findById(pollId)
      .populate("createdBy", "username profilePic")
      .populate("comments.uploadedBy", "username profilePic");
    if (!pollDoc) {
      return res.status(404).json({ error: "Poll not found" });
    }

    // Manually populate *all* votedUsers
    const votedUsers = await User.find({
      _id: { $in: pollDoc.content.votedUsers || [] }
    }).select("username profilePic");

    // Build your options array (ensure votes default to 0)
    const options = (pollDoc.content.options || []).map(opt => ({
      text: opt.text,
      votes: typeof opt.votes === "number" ? opt.votes : 0
    }));

    // Shape your comments
    const comments = (pollDoc.comments || []).map(c => ({
      _id:        c._id,
      replyText:  c.replyText,
      uploadedBy: c.uploadedBy,
      likesCount: c.likes.length,
      dislikesCount: c.dislikes.length,
      uploadedAt: c.uploadedAt
    }));

    // Assemble the full response
    const result = {
      _id:           pollDoc._id,
      circleId:      pollDoc.circleId,
      createdBy:     pollDoc.createdBy,
      type:          pollDoc.type,
      content: {
        question:   pollDoc.content.question,
        options,
        votedUsers
      },
      likesCount:    pollDoc.likes.length,
      dislikesCount: pollDoc.dislikes.length,
      createdAt:     pollDoc.createdAt,
      comments
    };

    res.status(200).json(result);
  } catch (err) {
    console.error("getPollResult error:", err);
    res.status(500).json({ error: "Failed to get poll results" });
  }
};


const createDiscussion = async (req, res) => {
  try {
    const { circleId } = req.params;
    req.body.createdBy = req.user.id;
    req.body.circleId = circleId;
    const senderId = req.user.id
   const Circle = await circle.findById(circleId);
    const thread = await circleThread.create(req.body);
   

  await notifyCircleOwner({
  
  type: 'new_thread', // or 'new_discussion', 'new_recommendation'
  message: `${req.user.user} started a new discussion in your circle ${Circle.name}`,
  link: `/circles/${circleId}`,
  circleId,
  senderId,
  req
  
});

    res.status(200).json(thread);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create discussion thread" });
  }
};

// const getDiscussion = async (req, res) => {
//   try {
//     const { discussId } = req.params;
//     const discussThread = await circleThread.findById(discussId);
//     res.status(200).json(discussThread);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to create discussion thread" });
//   }
// };

// const getDiscussion = async (req, res) => {
//   try {
//     const { discussId } = req.params;
//     const discussThread = await circleThread.findById(discussId)
//       .populate('createdBy', 'username profilePic')
//       .populate('likes', 'username profilePic')
//       .populate('dislikes', 'username profilePic')
//       .populate('comments.uploadedBy', 'username profilePic');

//     if (!discussThread) {
//       return res.status(404).json({ error: "Discussion not found" });
//     }

//     res.status(200).json({
//       ...discussThread.toObject(),
//       likesCount: discussThread.likes.length,
//       dislikesCount: discussThread.dislikes.length
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to get discussion" });
//   }
// };

const getDiscussion = async (req, res) => {
  try {
    const { discussId } = req.params;

    const discussThread = await circleThread.findById(discussId)
      .populate('createdBy', 'username profilePic')
      .populate('likes', 'username profilePic')
      .populate('dislikes', 'username profilePic')
      .populate({
        path: 'comments.uploadedBy',
        select: 'username profilePic'
      })
      // .populate({
      //   path: 'comments.likes',
      //   select: 'username profilePic'
      // })
      // .populate({
      //   path: 'comments.dislikes',
      //   select: 'username profilePic'
      // });

    if (!discussThread) {
      return res.status(404).json({ error: "Discussion not found" });
    }

    // Convert Mongoose doc to plain object
    const threadObject = discussThread.toObject();

    // Add main thread counts
    threadObject.likesCount = threadObject.likes?.length || 0;
    threadObject.dislikesCount = threadObject.dislikes?.length || 0;

    // Add counts to each comment
    threadObject.comments = threadObject.comments?.map(comment => ({
      ...comment,
      likesCount: comment.likes?.length || 0,
      dislikesCount: comment.dislikes?.length || 0
    })) || [];

    res.status(200).json(threadObject);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get discussion" });
  }
};


const createRecommendation = async (req, res) => {
  try {
    const { circleId } = req.params;
    req.body.createdBy = req.user.id;
    req.body.circleId = circleId;
   const senderId = req.user.id
   const Circle = await circle.findById(circleId);
    const thread = await circleThread.create(req.body);

    
  await notifyCircleOwner({
  
  type: 'new_thread', // or 'new_discussion', 'new_recommendation'
  message: `${req.user.user} created a recommendation in your circle ${Circle.name}`,
  link: `/circles/${circleId}`,
  circleId,
  senderId,
  req

  })

    res.status(200).json(thread);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create recommendation thread" });
  }
};

// const getRecommendation = async (req, res) => {
//     try {
//         const { recommendId } = req.params;
//         const recommendationThread = await circleThread.findById(recommendId);

//       res.status(200).json(recommendationThread);
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ error: "Failed to create discussion thread" });
//     }
//   };

const getRecommendation = async (req, res) => {
  try {
    const { recommendId } = req.params;
    const recommendation = await circleThread.findById(recommendId)
      .populate('createdBy', 'username profilePic')
      .populate('likes', 'username profilePic')
      .populate('dislikes', 'username profilePic')
      .populate('comments.uploadedBy', 'username profilePic');

    if (!recommendation) {
      return res.status(404).json({ error: "Recommendation not found" });
    }

    res.status(200).json({
      ...recommendation.toObject(),
      likesCount: recommendation.likes.length,
      dislikesCount: recommendation.dislikes.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get recommendation" });
  }
};

// Search circles
const searchCircles = async (req, res) => {
  try {
    const { query } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const circles = await circle.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    })
      .populate('createdBy', 'username profilePic')
      .populate('members', 'username profilePic')
      .populate('moderators', 'username profilePic')
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await circle.countDocuments({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    });

    res.status(200).json({
      data: circles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to search circles" });
  }
};

// Search members in a circle
const searchMembers = async (req, res) => {
  try {
    const { circleId } = req.params;
    const { query } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const foundCircle = await circle.findById(circleId)
      .populate({
        path: 'members',
        match: { username: { $regex: query, $options: 'i' } },
        select: 'username profilePic',
        options: {
          skip: (page - 1) * limit,
          limit: limit
        }
      });

    if (!foundCircle) {
      return res.status(404).json({ error: "Circle not found" });
    }

    const total = await User.countDocuments({
      _id: { $in: foundCircle.members },
      username: { $regex: query, $options: 'i' }
    });

    res.status(200).json({
      data: foundCircle.members,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to search members" });
  }
};

/**
 * List all polls in a circle, with pagination & sorting.
 */
const getAllPolls = async (req, res) => {
  try {
    const { circleId } = req.params;
    const page   = parseInt(req.query.page)   || 1;
    const limit  = parseInt(req.query.limit)  || 10;
    const sortBy = req.query.sortBy            || "-createdAt";

    const query = { circleId, type: "poll" };

    const [polls, total] = await Promise.all([
      circleThread.find(query)
        .populate("createdBy", "username profilePic")
        .sort(sortBy)
        .skip((page - 1) * limit)
        .limit(limit),
      circleThread.countDocuments(query)
    ]);

    res.status(StatusCodes.OK).json({
      data: polls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    });
  } catch (err) {
    console.error("getAllPolls error:", err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to get polls" });
  }
};

/**
 * List all recommendations in a circle, with pagination & sorting.
 */
const getAllRecommendations = async (req, res) => {
  try {
    const { circleId } = req.params;
    const page   = parseInt(req.query.page)   || 1;
    const limit  = parseInt(req.query.limit)  || 10;
    const sortBy = req.query.sortBy            || "-createdAt";

    const query = { circleId, type: "recommendation" };

    const [recs, total] = await Promise.all([
      circleThread.find(query)
        .populate("createdBy", "username profilePic")
        .sort(sortBy)
        .skip((page - 1) * limit)
        .limit(limit),
      circleThread.countDocuments(query)
    ]);

    res.status(StatusCodes.OK).json({
      data: recs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    });
  } catch (err) {
    console.error("getAllRecommendations error:", err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to get recommendations" });
  }
};``


module.exports = {
  createPoll,
  votePoll,
  getPollResult,
  createDiscussion,
  getDiscussion,
  getAllDiscussions,
  searchDiscussions,
  createRecommendation,
  getRecommendation,
  likeThread,
  dislikeThread,
  searchCircles,
  searchMembers,
  searchLimiter,
    getAllPolls,
  getAllRecommendations,
};