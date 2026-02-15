const express = require("express");

const profile = require("../models/profile");
const ratings = require("../models/ratings");
const User = require("../models/User");
const CustomAPIError = require("../errors/custom-api");
const { StatusCodes } = require("http-status-codes");

const getProfilePic = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.json({ profilePic: "https://fakeimg.pl/50x50" }); 
    }
    res.json({ profilePic: user.profilePic || "https://fakeimg.pl/50x50" });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve profile picture" });
  }
};

const addProfilePic = async (req, res) => {
  try {
    let imageUrl = req.file ? req.file.path : req.body.imageUrl;

    if (!imageUrl) {
      return res.status(400).json({ error: "No image file or URL provided" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePic: imageUrl },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Profile updated", imageUrl: user.profilePic });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Profile update failed" });
  }

  /*  const uploadProfilePic = await   profile.findOne(
        {uploadedBy:req.user.id})


    if (uploadProfilePic===null){

        await profile.create(
            req.body)
    }

    else if (uploadProfilePic.uploadedBy == req.user.id){

        const user = await  profile.findByIdAndUpdate(uploadProfilePic._id,
            req.body)

        console.log(user)
    }

        res.status(200).json('Picture uploaded sucessfully')*/
};

const removeProfilePic = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, { profilePic: "" });
    res.json({ message: "Profile Pic removed" });
  } catch (error) {
    res.status(500).json({ error: "Upload failed" });
  }
};

const addRating = async (req, res) => {
  req.body.uploadedBy = req.user.id;
  const rating = await ratings.create(req.body);

  res.json(rating);
};

const getallRating = async (req, res) => {
  req.body.uploadedBy = req.user.id;
  const rating = await ratings.find({ uploadedBy: req.user.id });

  res.json({ count: rating.length, data: rating });
};

module.exports = {
  getProfilePic,
  addProfilePic,
  addRating,
  getallRating,
  removeProfilePic,
};
