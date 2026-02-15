// middleware/requireCircleMember.js
const Circle = require('../models/circleschema');
const CircleThread = require('../models/circleThreadSchema');
const { StatusCodes } = require('http-status-codes');

module.exports = async function requireCircleMember(req, res, next) {
  const userId = req.user.id;
  let circleId = req.params.circleId;

  // if there's no circleId, derive it from a thread ID
  if (!circleId) {
    const threadId =
      req.params.discussId   ||
      req.params.pollId      ||
      req.params.recommendId ||  // for GET /:recommendId/recommendation
      req.params.recommId;      // for POST /:recommId/recommendation/addcomment, etc.

    if (threadId) {
      const thread = await CircleThread.findById(threadId);
      if (!thread) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ error: 'Thread not found' });
      }
      circleId = thread.circleId.toString();
    }
  }

  if (!circleId) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: 'No circle or thread id in params' });
  }

  const circle = await Circle.findById(circleId);
  if (!circle) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ error: 'Circle not found' });
  }

  // check if user is creator, moderator, or a member
  const isCreator   = circle.createdBy.equals(userId);
  const isModerator = Array.isArray(circle.moderators) &&
                      circle.moderators.some(m => m.equals(userId));
  const isMember    = Array.isArray(circle.members) &&
                      circle.members.some(m => m.equals(userId));

  if (isCreator || isModerator || isMember) {
    req.circle = circle;
    return next();
  }

  return res
    .status(StatusCodes.FORBIDDEN)
    .json({ error: 'You must join the circle to perform this action' });
};
