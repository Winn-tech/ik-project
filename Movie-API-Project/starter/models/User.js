const mongoose = require("mongoose");
const bycrpt = require("bcryptjs");

const Userschema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Please provide name"],
    minlength: 3,
    maxlength: 50,
  },
  email: {
    type: String,
    required: [true, "Please provide an email"],
    unique: true,
    minlength: 3,
    maxlength: 50,
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      "Please provide email",
    ],
  },
  password: {
    type: String,
    required: [true, "please provide a password"],
    minlength: 6,
  },

  resetPasswordToken: String,

  resetPasswordExpires: Date,

  profilePic: {
    type: String,
    default: "https://i.pravatar.cc/150?img=20",
  },

   createdAt: {
    type: Date,
    default: Date.now,
  },
});

Userschema.pre("save", async function (next) {
  const salt = await bycrpt.genSalt(10);
  this.password = await bycrpt.hash(this.password, salt);

  next();
});

module.exports = mongoose.model("User", Userschema);
