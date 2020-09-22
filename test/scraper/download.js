/**
 * test/scraper/download
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const ScraperFileSystem = require("../../lib/filesystems/scraper-filesystem")

const Download = require('../lib/_download');
const logger = require('../../lib/logger');

logger.info("=== tests: scraper download");

logger.info("--- adding ScraperFileSystem to storage cortex");
storage.FileSystems.use("http", ScraperFileSystem);

async function tests() {

  let download = new Download({
    origin: {
      smt: "json|http://localhost/test/data/|*.gz|*",
      options: {
        recursive: false,
        forEach: (name) => {
          logger.info("- " + name);
        }
      }
    },
    terminal: "./test/output/"
  });

  logger.info("=== download scraper directory (forEach)");
  let list = await download.list();
  
  for (let entry of list) {
    console.log(JSON.stringify(entry,null,2));
    await download.getFile(entry)
  }

  await download.relax();
}

tests();
