const Review = require("../models/userreview");
const { StatusCodes } = require("http-status-codes");

// const addReview = async (req, res) => {
//   try {
//     req.body.uploadedBy = req.user.id; // only works if route is protected
//     const newReview = await Review.create(req.body);
//     res.json(newReview);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };

const addReview = async (req, res) => {
  const { mediaId, mediaType, rating, reviewText, Subject } = req.body;

  // 1) Validate required fields
  if (!mediaId || !mediaType || rating == null || !reviewText) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "mediaId, mediaType, rating and reviewText are all required"
    });
  }

  try {
    // 2) Create
    const created = await Review.create({
      mediaId,
      mediaType,
      rating,
      reviewText,
      Subject,
      uploadedBy: req.user.id
    });

    // 3) Populate author, likes/dislikes, and each reply’s author + reactions
    const populated = await created.populate([
      { path: "uploadedBy",     select: "username profilePic" },
      { path: "likes",          select: "username" },
      { path: "dislikes",       select: "username" },
      { path: "reply.uploadedBy", select: "username profilePic" },
      { path: "reply.likes",    select: "username" },
      { path: "reply.dislikes", select: "username" }
    ]);

    // 4) Return
    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Review added successfully",
      data: populated
    });

  } catch (error) {
    console.error("addReview error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to add review",
      error: error.message
    });
  }
};

// const getAllReviews = async (req, res) => {
//   const reviews = await Review.find()
//     .populate("uploadedBy", "username profilePic");
//   res.json(reviews);
// };

const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("uploadedBy", "username profilePic")
      .populate("likes", "username")
      .populate("dislikes", "username")
      .populate("reply.uploadedBy", "username profilePic")
      .populate("reply.likes", "username")
      .populate("reply.dislikes", "username");

    return res.status(StatusCodes.OK).json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error("getAllReviews error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to load reviews",
      error: error.message
    });
  }
};

const likeReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    review.likes = review.likes || [];
    review.dislikes = review.dislikes || [];

    const liked = review.likes.includes(userId);
    const disliked = review.dislikes.includes(userId);

    if (liked) {
      review.likes = review.likes.filter((id) => id.toString() !== userId);
    } else {
      review.likes.push(userId);
      if (disliked) {
        review.dislikes = review.dislikes.filter(
          (id) => id.toString() !== userId
        );
      }
    }
    await review.save();
    res.json({ message: liked ? "Like removed" : "Review liked" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const dislikeReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    review.likes = review.likes || [];
    review.dislikes = review.dislikes || [];

    const liked = review.likes.includes(userId);
    const disliked = review.dislikes.includes(userId);

    if (disliked) {
      review.dislikes = review.dislikes.filter(
        (id) => id.toString() !== userId
      );
    } else {
      review.dislikes.push(userId);
      if (liked) {
        review.likes = review.likes.filter((id) => id.toString() !== userId);
      }
    }
    await review.save();
    res.json({ message: disliked ? "Dislike removed" : "Review disliked" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = {
  addReview,
  getAllReviews,
  likeReview,
  dislikeReview,
};
