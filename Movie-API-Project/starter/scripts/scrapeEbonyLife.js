require('dotenv').config();
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

async function downloadImage(url) {
  try {
    const file = path.join('/tmp', `${uuidv4()}.jpg`);
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to fetch image: ${resp.statusText}`);
    fs.writeFileSync(file, Buffer.from(await resp.arrayBuffer()));
    return file;
  } catch (err) {
    console.error('Download error:', err);
    return null;
  }
}

async function uploadToCloudinary(localPath) {
  try {
    const result = await cloudinary.uploader.upload(localPath, {
      folder: 'ebonylife-posters',
    });
    fs.unlinkSync(localPath);
    return result.secure_url;
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    return null;
  }
}

async function scrapeEbonyLife() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.goto('https://ebonylifecinemas.com', { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector('[class*="MovieList_containerGrid__"] article');

    const html = await page.content();
    const $ = cheerio.load(html);

    const articles = $('[class*="MovieList_containerGrid__"] article[class*="MovieList_movie__"]');
    const allMovies = [];

    articles.each((_, el) => {
      const $el = $(el);

      const poster = $el.find('div[class*="MovieList_poster__"] img').attr('src') || '';
      const title = $el.find('h1[class*="MovieList_title__"]').text().trim() || '';
      const description = $el.find('p[class*="MovieList_text__"]').text().trim() || '';
      const detailRel = $el.find('a[class*="MovieList_link__"]').attr('href') || '';
      const detailPage = detailRel ? new URL(detailRel, 'https://ebonylifecinemas.com').href : null;

      const featureEls = $el.find('div[class*="FilmFeatures_items__"] p');
      const features = featureEls
        .map((__, p) => $(p).text().trim())
        .get()
        .filter(Boolean);

      const showtimeEls = $el.find('section[class*="MovieList_showTimes__"] .MovieList_row__PVYxw').find('button,a');
      const showtimes = [];
      showtimeEls.each((__, btn) => {
        const raw = $(btn).text().trim();
        const cleaned = raw.replace(/Screen\s?\d+/gi, '').replace(/\s{2,}/g, ' ').trim();
        showtimes.push(cleaned);
      });

      allMovies.push({
        title,
        description,
        genres: features,
        poster,
        detailPage,
        showtimes,
      });
    });

    const finalMovies = [];
    for (const movie of allMovies) {
      let newPoster = null;
      if (movie.poster) {
        const localPath = await downloadImage(movie.poster);
        if (localPath) newPoster = await uploadToCloudinary(localPath);
      }
      finalMovies.push({ ...movie, poster: newPoster || movie.poster });
    }

    return {
      lastUpdated: new Date().toISOString(),
      lagos: finalMovies, // Only one cinema => use "lagos"
    };
  } catch (err) {
    console.error('EbonyLife scrape error:', err);
    return { lastUpdated: new Date().toISOString(), lagos: [] };
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeEbonyLife };
