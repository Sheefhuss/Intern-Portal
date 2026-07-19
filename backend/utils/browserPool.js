const puppeteer = require('puppeteer');

let browserPromise = null;

const getBrowser = () => {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browserPromise;
};

process.on('exit', () => {
  if (browserPromise) browserPromise.then(b => b.close()).catch(() => {});
});

module.exports = { getBrowser };