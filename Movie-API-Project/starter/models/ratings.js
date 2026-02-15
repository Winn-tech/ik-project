const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema({
  media_type: {
    type: String,
    enum: ["movie", "tv"],
    required: true,
  },
  media_id: {
    type: Number,
    required: true,
  },
  rating: {
    type: Number,
    required: [true, "Please provide a rating"],
    minlength: 1,
    maxlength: 10,
  },

  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }, // Reference to user
  uploadedAt: { type: Date, default: Date.now }, // Upload timestamp
});

module.exports = mongoose.model("Rating", ratingSchema);
