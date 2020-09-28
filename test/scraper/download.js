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
  logger.info("=== download from HTML directory page");

  logger.verbose("--- create scraper");
  let scraper = new Scraper({
    origin: {
      smt: "csv|http://localhost/test/data/|*.xml|*",
      options: {
        recursive: false,
        saveFiles: true
      }
    },
    terminal: "./test/output/downloads/"
  });

  logger.info("=== scraper load directory page");
  let list = await scraper.loadPage();

  logger.info("=== scraper download files");
  for (let entry of list) {
    logger.verbose(JSON.stringify(entry, null, 2));
    await scraper.downloadFile(entry);
  }

  await scraper.relax();
}

async function test_2() {
  logger.info("=== download shape files");

  logger.verbose("--- create scraper");
  let scraper = new Scraper({
    origin: {
      smt: "shp|http://ec2-3-208-205-6.compute-1.amazonaws.com/shapefiles/|*.*|*",
      options: {
        recursive: true,
        saveFiles: true
      }
    },
    terminal: "./test/output/shapefiles/"
  });

  logger.info("=== scraper load directory page");
  let list = await scraper.loadPage();

  logger.info("=== scraper download files");
  for (let entry of list) {
    logger.verbose(JSON.stringify(entry, null, 2));
    await scraper.downloadFile(entry);
  }

  await scraper.relax();
}


(async () => {
  await test_1();
  await test_2();
})();
