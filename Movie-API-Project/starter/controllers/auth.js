const mongoose = require("mongoose");
const User = require("../models/User");
const bycrpt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const UnauthenticatedError = require("../errors/unauthenticated");
const { StatusCodes } = require("http-status-codes");

// const login = async(req,res)=>{

// const {email,password} = req.body

// if (!email||!password){
//     res.status(401).send('Invalid Login')
// }

// const user = await User.findOne({email})

// if (!user) {
//     //res.status(201).send('User does not exist')
//     throw new UnauthenticatedError('User does not exist',StatusCodes.UNAUTHORIZED)
// }

// const compare = await bycrpt.compare(password,user.password)

// if(compare) {

// const token = jwt.sign({id:user._id,email:email,userName:user.username},process.env.JWT_SECRET,{expiresIn:'30d'})
//     //console.log(token)
//     res.status(200).json({token})
// }

// else{
//     res.status(401).send('Invalid email or password')
// }

// }

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(401).send("Invalid Login");
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw new UnauthenticatedError(
      "User does not exist",
      StatusCodes.UNAUTHORIZED
    );
  }
  const compare = await bycrpt.compare(password, user.password);
  if (compare) {
    const token = jwt.sign(
      { id: user._id, email: email, userName: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    // Set the cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    // Also send in JSON for fallback
    res.status(200).json({ token });
  } else {
    res.status(401).send("Invalid email or password");
  }
};

// const register = async (req, res) => {
//   const { username, password, email } = req.body;

//   if (!username || !password || !email) {
//     res.status(401).send("Please fill in the data");
//   }

//   const user = await User.create({ ...req.body });

//   res.status(200).json(user);
// };

const register = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Username, email and password are required"
    });
  }
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(StatusCodes.CONFLICT).json({
      success: false,
      message: "Email already registered"
    });
  }
  const user = await User.create({ username, email, password });
  const token = jwt.sign(
    { id: user._id, email: user.email, userName: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "User registered successfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic
    },
    token
  });
};


const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    //res.status(201).send('User does not exist')
    throw new UnauthenticatedError(
      "User does not exist",
      StatusCodes.UNAUTHORIZED
    );
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expires = Date.now() + 1000 * 60 * 30;

  user.resetPasswordToken = token;
  user.resetPasswordExpires = expires;

  await user.save();

  const resetlink =
  process.env.NODE_ENV === "production"
    ? `https://movie-flicks.vercel.app/reset-password?token=${token}`
    : `http://localhost:8081/reset-password?token=${token}`;

  // Set up nodemailer
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `FlicksLounge Password Reset <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Password Reset Link",
    text: `Click here to reset your password: ${resetlink}`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err)
      return res.status(500).json({ message: "Failed to send email", err });
    res.json({ message: "Reset link sent to your email" });
  });
};

const resetPassword = async (req, res) => {
  const { newPassword } = req.body;
  const { token } = req.query;

  console.log(newPassword, token);

  const user = await User.findOne({
    resetPasswordToken: token,
  });
  user.password = newPassword;
  await user.save();
  console.log(user);
  res.send("ok");
};

module.exports = { login, register, forgotPassword, resetPassword };
