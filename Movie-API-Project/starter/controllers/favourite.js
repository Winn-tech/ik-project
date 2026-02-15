const favourite = require('../models/favourite')
const { mediaDetails } = require('../API/tmdb_api')

const addFavourite = async (req, res) => {

    req.body.uploadedBy = req.user.id
    const add = await favourite.create(req.body)
    res.json(add)

}

const delFavourite = async (req, res) => {

    req.body.uploadedBy = req.user.id

    console.log(req.params)
    await favourite.findOneAndRemove({
        media_id: req.params.id, uploadedBy: req.user.id
    });

    res.send('ok')

}

const getallFavourites = async (req, res) => {

    req.body.uploadedBy = req.user.id
    const add = await favourite.find({ uploadedBy: req.user.id })
    console.log(add)

    res.json({ data: add, count: add.length })


}

const getFavourite = async (req, res) => {
    req.body.uploadedBy = req.user.id
    const mediaID = req.params.id
    console.log(mediaID)

    //const data = await mediaDetails('movie',mediaID)

    //res.json(data)

    const data = await favourite.findOne({ uploadedBy: req.user.id, media_id: req.params.id })

    res.send(data)
}


module.exports = { addFavourite, delFavourite, getallFavourites, getFavourite }