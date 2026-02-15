const mongoose = require("mongoose");

const HottestCircleSchema = new mongoose.Schema({
  circleId: mongoose.Schema.Types.ObjectId,
  name: String,
  description: String,
  totalPosts: Number,
  totalPolls: Number,
  totalDiscussions: Number,
  totalRecommendations: Number,
  totalComments: Number,
  totalLikes: Number,
  lastActivity: Date,
  hoursSinceLastActivity: Number,
  hotScore: Number
}, { _id: false });

const HottestPollSchema = new mongoose.Schema({
  circleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Circle',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: Date,
  votes: Number,
  commentsCount: Number,
  hotScore: Number,
  question: String,
  
}, { _id: false });

const HottestDiscussionSchema = new mongoose.Schema({
  circleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Circle',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: Date,
  commentsCount: Number,
  likesCount: Number,
  title: String,
  hotScore: Number,
  
}, { _id: false });


const WeeklyLeaderboardSchema = new mongoose.Schema({
  weekStart: { type: Date, required: true },
  hottestCircles: [HottestCircleSchema],
  hottestPolls:[HottestPollSchema],
  hottestDiscussions: [HottestDiscussionSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("WeeklyLeaderboard", WeeklyLeaderboardSchema);
