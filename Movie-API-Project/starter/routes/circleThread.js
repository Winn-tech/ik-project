const express = require("express");

const { createPoll, votePoll, getPollResult, createDiscussion, getDiscussion, getAllDiscussions, searchDiscussions, createRecommendation, getRecommendation, likeThread, dislikeThread, searchCircles, searchMembers, searchLimiter, getAllPolls, getAllRecommendations  } = require("../controllers/circleThread");
const { addThreadComment, likeComment, dislikeComment } = require('../controllers/circleThreadComments');
const requireCircleMember = require("../middleware/requireCircleMember");

const circleThreadRouter = express.Router();

//Thread Routes(add threads, like and dislike threads)
circleThreadRouter.route("/:circleId/poll").post(requireCircleMember ,createPoll)
circleThreadRouter.route("/:circleId/discussion").post(requireCircleMember ,createDiscussion);
circleThreadRouter.route("/:circleId/discussions").get(getAllDiscussions);
circleThreadRouter.route("/:circleId/discussions/search").get(searchLimiter, searchDiscussions);
circleThreadRouter.route("/:circleId/recommendation").post(requireCircleMember ,createRecommendation);
circleThreadRouter
    .route("/:circleId/polls")
    .get(getAllPolls);

circleThreadRouter
    .route("/:circleId/recommendations")
    .get(getAllRecommendations);
circleThreadRouter.route("/:discussId/discussion").get(getDiscussion);
circleThreadRouter.route("/:pollId/poll").patch( requireCircleMember ,votePoll).get(getPollResult)
circleThreadRouter.route("/:recommendId/recommendation").get(getRecommendation)
circleThreadRouter.route("/:discussId/discussion/like").patch(likeThread);
circleThreadRouter.route("/:discussId/discussion/dislike").patch(dislikeThread);
circleThreadRouter.route("/:recommId/recommendation/like").patch(likeThread);
circleThreadRouter.route("/:recommId/recommendation/dislike").patch(dislikeThread);
circleThreadRouter.route("/:pollId/poll/like").patch(likeThread)
circleThreadRouter.route("/:pollId/poll/dislike").patch(dislikeThread);

// Thread Comment Routes(add comments on threads, dislike and like comments)
circleThreadRouter.route("/:pollId/poll/addcomment").patch(requireCircleMember ,addThreadComment)
circleThreadRouter.route("/:discussId/discussion/addcomment").patch(requireCircleMember ,addThreadComment)
circleThreadRouter.route("/:recommId/recommendation/addcomment").patch(requireCircleMember ,addThreadComment)
circleThreadRouter.route("/:pollId/poll/:commentId/like").patch(likeComment)
circleThreadRouter.route("/:discussId/discussion/commentId/like").patch(likeComment)
circleThreadRouter.route("/:recommId/recommendation/commentId/like").patch(likeComment)
circleThreadRouter.route("/:pollId/poll/:commentId/dislike").patch(dislikeComment)
circleThreadRouter.route("/:discussId/discussion/commentId/dislike").patch(dislikeComment)
circleThreadRouter.route("/:recommId/recommendation/commentId/dislike").patch(dislikeComment)

// Search Routes
circleThreadRouter.route("/search/circles").get(searchLimiter, searchCircles);
circleThreadRouter.route("/:circleId/search/members").get(searchLimiter, searchMembers);

module.exports = circleThreadRouter;