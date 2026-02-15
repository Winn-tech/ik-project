const express = require("express");

const {
  getProfilePic,
  addProfilePic,
  addRating,
  getallRating,
  removeProfilePic,
} = require("../controllers/profile");
const upload = require("../middleware/upload");

const profileRouter = express.Router();

profileRouter.route("/remove").delete(removeProfilePic);
profileRouter.route("/upload").post(upload.single("image"), addProfilePic);
profileRouter.route("/picture").get(getProfilePic);
profileRouter.route("/ratings").post(addRating).get(getallRating);

module.exports = profileRouter;