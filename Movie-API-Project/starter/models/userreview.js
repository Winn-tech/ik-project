// // models/userreview.js
// const mongoose = require('mongoose');

// const reviewSchema = new mongoose.Schema({
//   uploadedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   mediaId: {
//     type: String,
//     required: true
//   },
//   mediaType: {
//     type: String,
//     enum: ['movie', 'tv'],
//     required: true
//   },
//   rating: {
//     type: Number,
//     min: 0,
//     max: 10,
//     required: true
//   },
//   reviewText: {
//     type: String,
//     maxlength: 1000
//   },
//   Subject: {
//     type: String,
//     maxlength: 100
//   },
//   likes: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   }],
//   dislikes: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   }],
//   uploadedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// module.exports = mongoose.model('Review', reviewSchema);

const mongoose = require("mongoose");
//const replySchema = require('./replies')

const replySchema = new mongoose.Schema({
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

const reviewSchema = new mongoose.Schema({
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the User model
    required: true,
  },
  mediaId: {
    type: String, // TMDB movie/TV show ID
    required: true,
  },
  mediaType: {
    type: String,
    enum: ["movie", "tv"],
    required: true,
  },
  rating: {
    type: Number,
    min: 0,
    max: 10,
    required: true,
  },

  reviewText: {
    type: String,
    maxlength: 2000,
    required: true,
  },
  Subject: {
    type: String,
    maxlength: 100,
  },

  reply: [replySchema],

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

module.exports = mongoose.model("Review", reviewSchema);
