//
///THIS IS NOT RELEVANT CAUSE A CRON JOB HAS BEEN IMPLEMENTED TO RUN THE SERVICES TO GET THE DATA FOR THE LEADERBOARD

/*const express = require('express');

const  {getHottestPollsController,getHottestDiscussionsController,getHottestCirclesController}  = require('../controllers/leaderboardcontroller');

const leaderboardRouter = express.Router()
leaderboardRouter.route('/poll').get(getHottestPollsController);
leaderboardRouter.route('/discussion').get(getHottestDiscussionsController);
leaderboardRouter.route('/circles').get(getHottestCirclesController);


module.exports = leaderboardRouter;

*/
const express = require('express');
const { getweeklyleaderboardController } = require('../controllers/leaderboardcontroller')

const leaderboardRouter = express.Router()
leaderboardRouter.route('/').get(getweeklyleaderboardController);

module.exports = leaderboardRouter;