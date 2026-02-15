const mongoose = require("mongoose");

const favouriteSchema = new mongoose.Schema({
    media_type: {
        type: String,
        enum: ["movie", "tv"],
        required: true,
      },
  media_id: {
    type: Number,
    required: true,
  },
  favorite: {
    type: Boolean,
    required: true,
  },

  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }, // Reference to user
  uploadedAt: { type: Date, default: Date.now }, // Upload timestamp
});

module.exports = mongoose.model("Favourite", favouriteSchema);
