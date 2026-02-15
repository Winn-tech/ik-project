const mongoose = require('mongoose');

const FilmhouseSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: 'filmhouseData',
  },
  lastUpdated: {
    type: Date,
    default: new Date(),
  },
  movies: {
    type: Array,
    default: [],
  },
});

module.exports = mongoose.model('Filmhouse', FilmhouseSchema);
