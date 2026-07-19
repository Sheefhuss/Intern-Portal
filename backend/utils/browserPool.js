let browserPromise = null;

const getBrowser = () => {
  if (!browserPromise) {

    if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
      const chromium = require('@sparticuz/chromium').default;
      const puppeteerCore = require('puppeteer-core');
      browserPromise = chromium.executablePath().then((executablePath) =>
        puppeteerCore.launch({
          args: chromium.args,
          executablePath,
          headless: true,
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