const watchlist = require('../models/watchlist')

const addWatchlist = async (req, res) => {

    req.body.uploadedBy = req.user.id
    const add = await watchlist.create(req.body)

    res.json(add)

}

// const delWatchList = async (req, res) => {

//     req.body.uploadedBy = req.user.id

//     console.log(req.params)
//     await watchlist.findOneAndRemove({ media_id: req.params.id, uploadedBy: req.user.id });

//     res.send('ok')

// }

const delWatchList = async (req, res) => {
    const Watchlist = require('../models/watchlist');
    await Watchlist.findOneAndDelete({
        media_id: req.params.id,
        uploadedBy: req.user.id
    });
    // Optionally send a JSON confirmation
    res.json({ success: true, message: "Removed from watchlist" });
};

const getallWatchlist = async (req, res) => {

    req.body.uploadedBy = req.user.id
    const add = await watchlist.find({ uploadedBy: req.user.id })
    console.log(add)

    res.json({ data: add, length: add.length })

}

module.exports = { addWatchlist, delWatchList, getallWatchlist }