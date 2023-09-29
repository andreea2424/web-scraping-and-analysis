const express = require('express');
const puppeteer = require('puppeteer');
const Sentiment = require('sentiment');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public')); // Serve front-end files from a "public" directory
app.get('/', (req, res) => {
  res.sendFile("/Users/andreeastanciu/Documents/test_tehnic/index.html");
});

app.post('/scrape', async (req, res) => {
  try {
    const { url, scrapeElements, analyzeSentiment, scrapeImages, scrapeArticleLinks } = req.body;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded' }); // Wait for the page to load

    const scrapedData = {};

    if (scrapeElements.includes('h3')) {
      scrapedData.headings = await page.$$eval('h3', (elements) =>
        elements.map((h) => h.textContent)
      );
    }

    if (scrapeElements.includes('p')) {
      scrapedData.paragraphs = await page.$$eval('p', (elements) =>
        elements.map((p) => p.textContent)
      );
    }

    if (scrapeElements.includes('div')) {
      scrapedData.divs = await page.$$eval('div', (elements) =>
        elements.map((d) => d.textContent)
      );
    }

    if (scrapeImages) {
      scrapedData.images = await page.$$eval('img', (elements) =>
        elements.map((img) => img.getAttribute('src'))
      );
    }

    if (scrapeArticleLinks) {
      scrapedData.articleLinks = await page.$$eval('a', (elements) =>
        elements
          .filter((a) => a.href && a.href.startsWith('http')) // Filter out non-http links
          .map((a) => a.href)
      );
    }

    // Combine all the text for sentiment analysis
    const combinedText = Object.values(scrapedData).flat().join(' ');

    // Analyze sentiment if requested
    if (analyzeSentiment) {
      const sentiment = new Sentiment();
      const sentimentResult = sentiment.analyze(combinedText);

      scrapedData.sentiment = sentimentResult;
    }

    // Word count
    const wordCount = combinedText.split(/\s+/).filter((word) => word).length;
    scrapedData.wordCount = wordCount;

    await browser.close();

    res.json(scrapedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing the request.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
