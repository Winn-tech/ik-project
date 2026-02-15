

///THIS IS NOT RELEVANT CAUSE A CRON JOB HAS BEEN IMPLEMENTED TO RUN THE SERVICES TO GET THE DATA FOR THE LEADERBOARD

/*const { getHottestPolls,getHottestDiscussions,getHottestCircles } = require('../Services/leaderboardService');

const getHottestPollsController = async (req, res) => {
  try {
   const polls = await getHottestPolls();
    res.json({ polls });
   console.log('happy');
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error getting leaderboard' });
  }
};



const getHottestDiscussionsController = async (req, res) => {
  try {
    const discussions = await getHottestDiscussions();
    res.status(200).json({ discussions });
  } catch (error) {
    console.error("Error fetching hottest discussions:", error);
    res.status(500).json({ message: "Server error" });
  }
};




const getHottestCirclesController = async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 1;
    console.log("getHottestCircles exists:", typeof getHottestCircles);

    const circles = await getHottestCircles(months);
    res.status(200).json({ circles });
  } catch (error) {
    console.error("Error fetching hottest circles:", error);
    res.status(500).json({ message: "Server error" });
  }
};






module.exports = {getHottestPollsController,getHottestDiscussionsController,getHottestCirclesController}*/


const WeeklyLeaderboard = require('../models/weeklyLeaderBoardSchema')
const client = require('../cache');


const getweeklyleaderboardController = async (req, res) => {
    const cacheKey = 'leaderboard:week';
  try {
    const cached =  await client.get(cacheKey)

    if (cached){
      console.log('Cache hit for leaderboard')
      return res.json(JSON.parse(cached))
    }
   const WeeklyLeaderboardResult = await WeeklyLeaderboard.findOne()
  .sort({ createdAt: -1 });
  //  res.json( {WeeklyLeaderboardResult} );
   console.log(WeeklyLeaderboardResult)

    await client.setEx(cacheKey,7 * 24 * 60 * 60, JSON.stringify(WeeklyLeaderboardResult))
    
    res.send(WeeklyLeaderboardResult )
   
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error getting leaderboard' });
  }
};

module.exports = {getweeklyleaderboardController}