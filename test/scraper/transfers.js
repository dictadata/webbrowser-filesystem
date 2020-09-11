/**
 * test/scraper/transfer
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const ScraperJunction = require("../../lib/scraper");

const transfer = require('../lib/_transfer');
const logger = require('../logger');

logger.info("=== Test: scraper");

console.log("--- adding ScraperJunction to storage cortex");
storage.use("scraper", ScraperJunction);


async function tests() {

  logger.info("=== scraper writer");
  await transfer({
    source: {
      smt: "csv|./test/data/|foofile.csv|*",
      options: {
        logger: logger
      }
    },
    destination: {
      smt: "scraper|connection string|foo_transfer|*",
      options: {
        logger: logger
      }
    }
  });

  logger.info("=== scraper reader");
  await transfer({
    source: {
      smt: "scraper|connection string|foo_transfer|*",
      options: {
        logger: logger
      }
    },
    destination: {
      smt: "csv|./test/output/|scraper_output.csv|*",
      options: {
        logger: logger
      }
    }
  });
}

tests();
