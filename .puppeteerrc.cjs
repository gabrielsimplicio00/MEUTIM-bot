const { join } = require("path");

module.exports = {
  cacheDirectory: join("/opt/render/project/src", ".cache", "puppeteer"),
};
