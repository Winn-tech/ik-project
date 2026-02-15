const mongoose = require('mongoose');

const EbonyLifeSchema = new mongoose.Schema({
  _id: { type: String, default: 'ebonyLifeData' },
  lastUpdated: { type: Date, default: new Date() },
  lagos: { type: Array, default: [] },
});

module.exports = mongoose.model('EbonyLife', EbonyLifeSchema);
