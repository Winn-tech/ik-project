const express = require('express')

const {addFavourite,delFavourite,getallFavourites,getFavourite }= require('../controllers/favourite')


const favouriteRouter = express.Router()


favouriteRouter.route('/').post(addFavourite).get(getallFavourites);
favouriteRouter.route('/:id').delete(delFavourite).get(getFavourite);

module.exports = favouriteRouter