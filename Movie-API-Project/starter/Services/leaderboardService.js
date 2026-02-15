const Poll = require('../models/circleThreadSchema');


const getHottestPolls = async () => {
  
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date();
oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const poll = await Poll.aggregate([
    {
      $match: {
        type: 'poll',
        createdAt: { $gte: oneMonthAgo }
      }
    },
    {
      $addFields: {
        votes: { $size: "$content.votedUsers" },
        commentsCount: { $size: "$comments" },
        hoursSincePosted: {
          $divide: [{ $subtract: [new Date(), "$createdAt"] }, 1000 * 60 * 60]
        },
        question: "$content.question"
      }
    },
    {
      $addFields: {
        hotScore: {
          $divide: [
            {
              $add: [
                { $multiply: ["$votes", 1.5] },
                { $multiply: ["$commentsCount", 3] }
              ]
            },
            "$hoursSincePosted"
          ]
        }
      }
    },
    { $sort: { hotScore: -1 } },
    { $limit: 5 },
    
    

    {
    $project: {
      _id: 1,
      circleId: 1,
      createdBy: 1,
      question:1,
    
      createdAt: 1,
      votes: 1,
      commentsCount: 1,
      hotScore: 1,
    }
  }
  ]);

  return poll
};

const getHottestDiscussions = async () => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  return await Poll.aggregate([
    {
      $match: {
        type: 'discussion',
        createdAt: { $gte: oneMonthAgo }
      }
    },
    {
      $addFields: {
        commentsCount: { $size: "$comments" },
        likesCount: { $size: "$likes" },
        hoursSincePosted: {
          $divide: [
            { $subtract: [new Date(), "$createdAt"] },
            1000 * 60 * 60
          ]
        },
        title: {
        $ifNull: ["$content.title", "Untitled Discussion"]
      }
      }
    },
    {
      $addFields: {
        hotScore: {
          $divide: [
            {
              $add: [
                { $multiply: ["$commentsCount", 3] },
                { $multiply: ["$likesCount", 1] }
              ]
            },
            "$hoursSincePosted"
          ]
        }
      }
    },
    { $sort: { hotScore: -1 } },
    { $limit: 5 },
    {
    $project: {
      _id: 1,
      circleId: 1,
      createdBy: 1,
      createdAt: 1,
      title: 1,
      likesCount: 1,
      commentsCount: 1,
      hotScore: 1
    }
  }
  ]);
};


const getHottestCircles = async (months = 1) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const circles = await Poll.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        circleId: { $exists: true },
      },
    },
    {
      $addFields: {
        latestCommentTime: {
          $cond: [
            { $gt: [{ $size: "$comments" }, 0] },
            {
              $max: {
                $map: {
                  input: "$comments",
                  as: "c",
                  in: "$$c.uploadedAt",
                },
              },
            },
            null,
          ],
        },
      },
    },
    {
      $addFields: {
        lastActivity: {
          $cond: [
            { $gt: ["$latestCommentTime", "$createdAt"] },
            "$latestCommentTime",
            "$createdAt",
          ],
        },
      },
    },
    {
      $group: {
        _id: "$circleId",
        totalPosts: { $sum: 1 },
        totalPolls: {
          $sum: { $cond: [{ $eq: ["$type", "poll"] }, 1, 0] },
        },
        totalDiscussions: {
          $sum: { $cond: [{ $eq: ["$type", "discussion"] }, 1, 0] },
        },
        totalRecommendations: {
          $sum: { $cond: [{ $eq: ["$type", "recommendation"] }, 1, 0] },
        },
        totalComments: {
          $sum: {
            $cond: [
              { $isArray: "$comments" },
              { $size: "$comments" },
              0,
            ],
          },
        },
        totalLikes: {
          $sum: {
            $cond: [
              { $isArray: "$likes" },
              { $size: "$likes" },
              0,
            ],
          },
        },
        lastActivity: { $max: "$lastActivity" },
      },
    },
    {
      $addFields: {
        hoursSinceLastActivity: {
          $divide: [
            { $subtract: [new Date(), "$lastActivity"] },
            1000 * 60 * 60,
          ],
        },
        hotScore: {
          $divide: [
            {
              $add: [
                { $multiply: [{ $ifNull: ["$totalPosts", 0] }, 3] },
                { $multiply: [{ $ifNull: ["$totalComments", 0] }, 2] },
                { $multiply: [{ $ifNull: ["$totalLikes", 0] }, 1] },
              ],
            },
            { $add: [{ $ifNull: ["$hoursSinceLastActivity", 1] }, 1] },
          ],
        },
      },
    },
    {
      $lookup: {
        from: "circles",
        localField: "_id",
        foreignField: "_id",
        as: "circleDetails",
      },
    },
    { $unwind: "$circleDetails" },
    { $sort: { hotScore: -1 } },
    {
      $project: {
        _id: 0,
        circleId: "$_id",
        name: "$circleDetails.name",
        description: "$circleDetails.description",
        totalPosts: 1,
        totalPolls: 1,
        totalDiscussions: 1,
        totalRecommendations: 1,
        totalComments: 1,
        totalLikes: 1,
        lastActivity: 1,
        hoursSinceLastActivity: 1,
        hotScore: 1,
      },
    },
  ]);

  return circles;
};





module.exports = {getHottestPolls,getHottestDiscussions,getHottestCircles}