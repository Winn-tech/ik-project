require('dotenv').config();
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

async function downloadImage(url) {
  try {
    const filename = `${uuidv4()}.jpg`;
    const filepath = path.join('/tmp', filename);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(buffer));
    return filepath;
  } catch (error) {
    console.error('Download error:', error.message);
    return null;
  }
}

/** Uploads local file to Cloudinary, returns the secure URL, and removes local file */
async function uploadToCloudinary(localPath) {
  try {
    const result = await cloudinary.uploader.upload(localPath, {
      folder: 'filmhouseng-posters',
    });
    fs.unlinkSync(localPath); // Remove file after upload
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary error:', error.message);
    return null;
  }
}

/** Gets the state->cinema->showtimes from the movie detail page */
async function getScreenings(page) {
  const screenings = {};

  try {
    // The detail page has exactly 3 dropdown buttons: [State, Cinema, Date]
    const dropdownButtons = await page.$$('button[id^="headlessui-listbox-button-"]');
    if (dropdownButtons.length < 3) {
      console.warn('Not all 3 dropdown buttons found on this page. Skipping...');
      return screenings;
    }

    const [stateButton, cinemaButton, dateButton] = dropdownButtons;

    // Grab list of states
    await stateButton.click();
    await page.waitForSelector('#headlessui-portal-root [role="option"] span', { visible: true });
    const states = await page.$$eval(
      '#headlessui-portal-root [role="option"] span',
      (options) => options.map((opt) => opt.textContent.trim())
    );
    await page.keyboard.press('Escape');

    // For each state:
    for (const state of states) {
      screenings[state] = [];

      // Select the state
      await stateButton.click();
      await page.waitForSelector('#headlessui-portal-root [role="option"]', { visible: true });
      await page.$$eval(
        '#headlessui-portal-root [role="option"]',
        (options, targetState) => {
          const option = options.find((opt) => {
            const span = opt.querySelector('span');
            return span && span.textContent.trim() === targetState;
          });
          if (option) option.click();
        },
        state
      );

      // Wait for the cinema dropdown to become enabled
      await page.waitForFunction(
        (btn) => !btn.disabled && btn.offsetParent !== null,
        { timeout: 30000 },
        cinemaButton
      );

      // Grab list of cinemas
      await cinemaButton.click();
      await page.waitForSelector('#headlessui-portal-root [role="option"] span', { visible: true });
      const cinemas = await page.$$eval(
        '#headlessui-portal-root [role="option"] span',
        (opts) => opts.map((o) => o.textContent.trim())
      );
      await page.keyboard.press('Escape');

      // For each cinema
      for (const cinema of cinemas) {
        await cinemaButton.click();
        await page.waitForSelector('#headlessui-portal-root [role="option"]', { visible: true });
        await page.$$eval(
          '#headlessui-portal-root [role="option"]',
          (options, targetCinema) => {
            const option = options.find((opt) => {
              const span = opt.querySelector('span');
              return span && span.textContent.trim() === targetCinema;
            });
            if (option) option.click();
          },
          cinema
        );

        // Select "Today" in the date dropdown
        await dateButton.click();
        await page.waitForSelector('#headlessui-portal-root [role="option"] span', { visible: true });
        await page.$$eval('#headlessui-portal-root [role="option"]', (options) => {
          const option = options.find((opt) => {
            const span = opt.querySelector('span');
            return span && span.textContent.trim().toLowerCase() === 'today';
          });
          if (option) option.click();
        });

        // Collect showtimes in .fh-card
        let showtimes = [];
        try {
          await page.waitForSelector('.fh-card a', { timeout: 5000 });
          showtimes = await page.$$eval('.fh-card a', (anchors) =>
            anchors.map((a) => a.textContent.trim())
          );
        } catch {
          // No showtimes or timed out
        }

        screenings[state].push({
          cinema,
          showtimes: showtimes.length > 0 ? showtimes : ['No showtimes available'],
        });
      }
    }
  } catch (error) {
    console.error('Error getting screenings:', error.message);
  }

  return screenings;
}

/**
 * Main scraping function.
 * Returns: { lastUpdated: ISOString, movies: [ ... ] }
 */
async function scrapeFilmhouse() {
  // Launch Puppeteer (headless = 'new' for Puppeteer v20+)
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
    ],
  });

  try {
    // Go to the main page
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );
    await page.setExtraHTTPHeaders({
      'accept-language': 'en-US,en;q=0.9',
      referer: 'https://filmhouseng.com/',
    });

    await page.goto('https://filmhouseng.com', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    // Parse the movie list
    const content = await page.content();
    const $ = cheerio.load(content);
    const movies = [];

    // Each movie link has an href like "/movie/xxx"
    $('.main-container a[href^="/movie/"]').each((_, el) => {
      const $el = $(el);
      const title = $el.find('p:first').text().trim();
      const detailPage = new URL($el.attr('href'), 'https://filmhouseng.com').href;

      const genres = $el
        .find('div.flex.items-center p')
        .map((__, p) => $(p).text().trim())
        .get();

      const imgSrc = $el.find('img').attr('src') || '';
      const poster = imgSrc.includes('url=')
        ? decodeURIComponent(imgSrc.split('url=')[1].split('&')[0])
        : new URL(imgSrc, 'https://filmhouseng.com').href;

      movies.push({ title, genres, poster, detailPage });
    });

    // For each movie, upload poster & gather showtimes
    const finalMovies = [];
    for (const movie of movies) {
      try {
        // Upload poster to Cloudinary
        let cloudinaryUrl = null;
        if (movie.poster) {
          const imagePath = await downloadImage(movie.poster);
          if (imagePath) {
            cloudinaryUrl = await uploadToCloudinary(imagePath);
          }
        }

        // Open detail page in a new tab to get showtimes
        const detailPage = await browser.newPage();
        await detailPage.goto(movie.detailPage, {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });

        const screenings = await getScreenings(detailPage);
        await detailPage.close();

        finalMovies.push({
          ...movie,
          poster: cloudinaryUrl || movie.poster,
          screenings,
        });
      } catch (err) {
        console.error(`Error processing "${movie.title}":`, err.message);
      }
    }

    // Return single timestamp + array of movies
    return {
      lastUpdated: new Date().toISOString(),
      movies: finalMovies,
    };
  } catch (err) {
    console.error('Scraping failed:', err);
    return {
      lastUpdated: new Date().toISOString(),
      movies: [],
    };
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeFilmhouse };
