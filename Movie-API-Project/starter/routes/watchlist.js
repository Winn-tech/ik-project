const express = require('express')

const {addWatchlist,delWatchList,getallWatchlist }= require('../controllers/watchlist')


const watchlistRouter = express.Router()


watchlistRouter.route('/').post(addWatchlist).get(getallWatchlist);
watchlistRouter.route('/:id').delete(delWatchList);

module.exports = watchlistRouter