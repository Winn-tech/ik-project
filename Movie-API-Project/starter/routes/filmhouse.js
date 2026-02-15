const express = require('express');
const router = express.Router();

const Filmhouse = require('../models/Filmhouse');
const { scrapeFilmhouse } = require('../scripts/scrapeFilmhouse');

// GET /api/filmhouse -> Return the stored data
router.get('/', async (req, res) => {
  try {
    const doc = await Filmhouse.findById('filmhouseData');
    if (!doc) {
      return res.status(200).json({
        lastUpdated: null,
        movies: [],
        message: 'No filmhouse data found in DB.',
      });
    }
    return res.status(200).json({
      lastUpdated: doc.lastUpdated,
      movies: doc.movies,
    });
  } catch (error) {
    console.error('Error fetching filmhouse data:', error);
    return res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// POST or GET /api/filmhouse/update -> Trigger a new scrape, upsert data
router.post('/update', async (req, res) => {
  try {
    const data = await scrapeFilmhouse();
    if (data.movies && data.movies.length > 0) {
      // We got fresh data; upsert into DB
      await Filmhouse.findByIdAndUpdate(
        'filmhouseData',
        {
          _id: 'filmhouseData',
          lastUpdated: data.lastUpdated,
          movies: data.movies,
        },
        { upsert: true }
      );

      return res.status(200).json({
        message: 'Successfully scraped and updated filmhouse data.',
        lastUpdated: data.lastUpdated,
        count: data.movies.length,
      });
    } else {
      // We got zero movies, so we don't wipe out old data
      return res.status(200).json({
        message: 'Scraper returned no movies. Old data retained.',
      });
    }
  } catch (error) {
    console.error('Update error:', error);
    return res.status(500).json({ error: 'Failed to update filmhouse data' });
  }
});

// (Optional) Accept GET /api/filmhouse/update to do the same:
router.get('/update', async (req, res) => {
  // Just forward to the same logic
  return router.handle({ ...req, method: 'POST' }, res);
});

module.exports = router;
