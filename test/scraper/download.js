/**
 * test/scraper/download
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const ScraperFileSystem = require("../../lib/filesystems/scraper-filesystem")

const Scraper = require('../lib/_scraper');
const logger = require('../../lib/logger');

logger.info("=== tests: scraper downloads");

logger.info("--- adding ScraperFileSystem to storage cortex");
storage.FileSystems.use("http", ScraperFileSystem);


async function test_1() {

  let scraper = new Scraper({
    origin: {
      smt: "json|http://localhost/test/data/|*.json|*",
      options: {
        recursive: false,
        saveFiless: true,
        forEach: (name) => {
          logger.info("- " + name);
        }
      }
    },
    terminal: "./test/output/downloads/"
  });

  logger.info("=== scraper list directory page (forEach)");
  let list = await scraper.loadPage();
  
  for (let entry of list) {
    logger.verbose(JSON.stringify(entry,null,2));
    await scraper.downloadFile(entry)
  }

  await scraper.relax();
}

(async () => {
  test_1();
})();
