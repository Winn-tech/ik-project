const express = require("express");
const router = express.Router();
const {
  addReview,
  getAllReviews,
  likeReview,
  dislikeReview
} = require("../controllers/review");
const authentication = require("../middleware/authentication");
const {addReply,likeReply,dislikeReply }= require('../controllers/replies')

// Anyone can GET all reviews (populated with username & profilePic)
router.get("/", getAllReviews);

// Auth required to POST a new review
router.post("/", authentication, addReview);

// Auth required to like/dislike
router.patch("/:reviewId/like", authentication, likeReview);
router.patch("/:reviewId/dislike", authentication, dislikeReview);

router.patch("/:reviewId", authentication, addReply);
router.patch("/:reviewId/reply/:replyId/like", authentication, likeReply);
router.patch("/:reviewId/reply/:replyId/dislike", authentication, dislikeReply);


module.exports = router;
