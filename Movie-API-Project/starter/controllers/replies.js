const Review = require("../models/userreview");

const addReply = async (req, res) => {
  const { reviewId } = req.params;
  const { replytext } = req.body;

  console.log(reviewId);
  const review = await Review.findById(reviewId);
  if (!review) return res.status(404).json({ msg: "Review not found" });

  // Push reply using embedded schema
  review.reply.push({
    uploadedBy: req.user.id,
    replyText: replytext,
    likes: [],
    dislikes: [],
  });

  await review.save();

  res.send("ok");
};

const likeReply = async (req, res) => {
  try {
    const { reviewId, replyId } = req.params;
    const userId = req.user.id;

    let review = await Review.findById(reviewId);
    console.log(reviewId, replyId);
    const reply = review.reply.filter((reply) => reply.id == replyId);
    console.log(reply[0]);
    //res.status(200).send('ok')
    if (!review) return res.status(404).json({ message: "Review not found" });
    if (!reply) return res.status(404).json({ message: "Review not found" });

    const liked = reply[0].likes.includes(userId);
    const disliked = reply[0].dislikes.includes(userId);
    console.log(liked);
    if (liked) {
      reply[0].likes = reply[0].likes.filter((id) => id.toString() !== userId);
    } else {
      reply[0].likes.push(userId);
      // Remove from dislikes if the user had disliked before
      reply[0].dislikes = reply[0].dislikes.filter(
        (id) => id.toString() !== userId
      );
    }

    await review.save();

    res.status(200).json({
      message: liked ? "Like removed" : "Review liked",
      likesCount: reply[0].likes.length,
      dislikesCount: reply[0].dislikes.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const dislikeReply = async (req, res) => {
  try {
    const { reviewId, replyId } = req.params;
    const userId = req.user.id;

    let review = await Review.findById(reviewId);

    const reply = review.reply.filter((reply) => reply.id == replyId);

    if (!review) return res.status(404).json({ message: "Review not found" });
    if (!reply) return res.status(404).json({ message: "Review not found" });

    const liked = reply[0].likes.includes(userId);
    const disliked = reply[0].dislikes.includes(userId);
    if (disliked) {
      reply[0].dislikes = reply[0].dislikes.filter(
        (id) => id.toString() !== userId
      );
    } else {
      reply[0].dislikes.push(userId);
      // Remove from likes if the user had liked before
      reply[0].likes = reply[0].likes.filter((id) => id.toString() !== userId);
    }

    await review.save();

    res.status(200).json({
      message: disliked ? "Dislike removed" : "Review disliked",
      likesCount: reply[0].likes.length,
      dislikesCount: reply[0].dislikes.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
module.exports = { addReply, likeReply, dislikeReply };
