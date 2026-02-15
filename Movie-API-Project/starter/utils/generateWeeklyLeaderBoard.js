// utils/generateWeeklyLeaderboard.js

const WeeklyLeaderboard = require("../models/weeklyLeaderBoardSchema");
const {getHottestCircles,getHottestPolls,getHottestDiscussions} = require("../Services/leaderboardService"); 

const generateWeeklyLeaderboard = async () => {
  const weekStart = new Date();
  weekStart.setUTCHours(0, 0, 0, 0); 

  console.log(weekStart)

  try {
    const hottestCircles = await getHottestCircles(1); // last 1 month
     const hottestPolls = await getHottestPolls();
     const hottestDiscussions = await getHottestDiscussions();

     

    const leaderboard = new WeeklyLeaderboard({
      weekStart,
      hottestCircles: hottestCircles,
      hottestPolls:hottestPolls,
      hottestDiscussions:hottestDiscussions,
    });

    await leaderboard.save();
    console.log("Weekly leaderboard saved.");
  } catch (err) {
    console.error("Failed to generate weekly leaderboard:", err);
  }
};

module.exports = generateWeeklyLeaderboard;
