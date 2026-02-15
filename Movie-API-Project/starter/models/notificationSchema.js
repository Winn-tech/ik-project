const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        type: { type: String, enum: ['mention', 'circle_join', 'new_thread'], required: true },

        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        message: {
            type: String,
            required: true
        },
        link: {
            type: String
        },
        circle: { type: mongoose.Schema.Types.ObjectId, ref: 'Circle' },
        read: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);


module.exports = mongoose.model("Notification", notificationSchema);
