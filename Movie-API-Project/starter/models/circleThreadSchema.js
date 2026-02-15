// const mongoose = require("mongoose");
// const { Schema } = mongoose;

// const pollSchema = new Schema(
//   {
//     question: { type: String, required: true },
//     options: [{ text: String, votes: { type: Number, default: 0 } }],
//     votedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
//   },
//   { _id: false }
// );

// const movieRecommendationSchema = new Schema(
//   {
//     mediaName: { type: String, required: true },
//     reviewText: String,
//     rating: {
//         type: Number,
//         minlength: 1,
//         maxlength: 10,
//       },
//   },
//   { _id: false }
// );

// const watchPartySchema = new Schema(
//   {
//     movieTitle: String,
//     tmdbId: String,
//     scheduledFor: Date,
//     streamingLink: String,
//     cinemaBookingLink: String,
//   },
//   { _id: false }
// );

// const discussionSchema = new Schema(
//   {
//     title: { type: String, required: true },
//     body: String,
//   },
//   { _id: false }
// );

// const circleThreadSchema = new Schema({
//   circleId: { type: Schema.Types.ObjectId, ref: "Circle", required: true },
//   createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

//   type: {
//     type: String,
//     enum: ["poll", "recommendation", "watchparty", "discussion"],
//     required: true,
//   },

//   content: {
//     type: Schema.Types.Mixed, // holds one of the above 4 sub-schemas
//     required: true,
//   },

//   createdAt: { type: Date, default: Date.now },
//   likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
//   dislikes: [{ type: Schema.Types.ObjectId, ref: "User" }],
//   comments: { type: String, },
// });

// module.exports = mongoose.model("CircleThread", circleThreadSchema);



const mongoose = require("mongoose");
const { Schema } = mongoose;

const pollSchema = new Schema(
  {
    question: { type: String, required: true },
    options: [{ text: String, votes: { type: Number, default: 0 } }],
    votedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { _id: false }
);

const movieRecommendationSchema = new Schema(
  {
    mediaName: { type: String, required: true },
    reviewText: String,
    rating: {
      type: Number,
      minlength: 1,
      maxlength: 10,
    },
  },
  { _id: false }
);

const watchPartySchema = new Schema(
  {
    movieTitle: String,
    tmdbId: String,
    scheduledFor: Date,
    streamingLink: String,
    cinemaBookingLink: String,
  },
  { _id: false }
);

const discussionSchema = new Schema(
  {
    title: { type: String, required: true },
    body: String,
  },
  { _id: false }
);

const commentSchema = new mongoose.Schema({
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the User model
    required: true,
  },


  replyText: {
    type: String,
    maxlength: 2000,
    required: true,
  },


  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  dislikes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const circleThreadSchema = new Schema({
  circleId: { type: Schema.Types.ObjectId, ref: "Circle", required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

  type: {
    type: String,
    enum: ["poll", "recommendation", "watchparty", "discussion"],
    required: true,
  },

  content: {
    type: Schema.Types.Mixed, // holds one of the above 4 sub-schemas
    ref: "User",
    required: true,
  },

  createdAt: { type: Date, default: Date.now },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [commentSchema],
});

module.exports = mongoose.model("CircleThread", circleThreadSchema);