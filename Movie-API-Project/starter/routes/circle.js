const express = require('express')

const { createCircle, joinCircle, leaveCircle, getAllCircle, getSingleCircle, deleteCircle, getCircleStatus } = require('../controllers/circle')


const circleRouter = express.Router()


circleRouter.route('/').post(createCircle)
circleRouter.route('/:circleId/join').patch(joinCircle)
circleRouter.route('/:circleId/leave').patch(leaveCircle)
circleRouter.route('/').get(getAllCircle)
circleRouter.route('/:circleId').get(getSingleCircle)
circleRouter.route('/:circleId').delete(deleteCircle)
circleRouter.route('/:circleId/status').get(getCircleStatus);


module.exports = circleRouter