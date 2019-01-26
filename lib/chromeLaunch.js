const webdriver = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const chromedriver = require("chromedriver");

const ChromeLauncher = module.exports = function (options) {
  this.options = options || {};
  this.service = new chrome.ServiceBuilder(chromedriver.path).build();
};

ChromeLauncher.prototype.open = function (url) {
  var chromeCapabilities = webdriver.Capabilities.chrome();
  var chromeOptions = {
    "args": ["--disable-infobars"]
  };
  chromeCapabilities.set("chromeOptions", chromeOptions);
  let options = new chrome.Options(chromeCapabilities);
  this.driver = chrome.Driver.createSession(options, this.service);
  this.driver.get(url);
};
