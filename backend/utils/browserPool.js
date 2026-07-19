let browserPromise = null;

const getBrowser = () => {
  if (!browserPromise) {
    if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
      const chromium = require('@sparticuz/chromium');
      const puppeteerCore = require('puppeteer-core');
      browserPromise = chromium.executablePath().then((executablePath) =>
        puppeteerCore.launch({
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath,
          headless: chromium.headless,
        })
      ).catch((err) => {
        browserPromise = null;
        throw err;
      });
    } else {
      const puppeteer = require('puppeteer');
      browserPromise = puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      }).catch((err) => {
        browserPromise = null;
        throw err;
      });
    }
  }
  return browserPromise;
};

process.on('exit', () => {
  if (browserPromise) browserPromise.then(b => b.close()).catch(() => {});
});

module.exports = { getBrowser };