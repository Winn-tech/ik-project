const express = require('express');
const router = express.Router();
const EbonyLife = require('../models/EbonyLife');
const { scrapeEbonyLife } = require('../scripts/scrapeEbonyLife');

router.get('/', async (req, res) => {
  try {
    const doc = await EbonyLife.findById('ebonyLifeData');
    if (!doc) return res.json({ lastUpdated: null, lagos: [] });
    res.json({
      lastUpdated: doc.lastUpdated,
      lagos: doc.lagos || [],
    });
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch EbonyLife data' });
  }
});

router.post('/update', async (req, res) => {
  try {
    const data = await scrapeEbonyLife();
    if (data.lagos && data.lagos.length > 0) {
      await EbonyLife.findByIdAndUpdate(
        'ebonyLifeData',
        {
          _id: 'ebonyLifeData',
          lastUpdated: data.lastUpdated,
          lagos: data.lagos,
        },
        { upsert: true }
      );
      return res.json({ message: 'EbonyLife updated', lastUpdated: data.lastUpdated });
    }
    res.json({ message: 'No new EbonyLife data; old data retained' });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'EbonyLife update failed' });
  }
});

router.get('/update', async (req, res) => {
  return router.handle({ ...req, method: 'POST' }, res);
});

module.exports = router;
