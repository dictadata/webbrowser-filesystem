/**
 * test/scraper/dull
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const ScraperJunction = require("../../lib/scraper");

const dull = require('../lib/_dull');
const logger = require('../logger');

logger.info("=== Test: scraper");

console.log("--- adding ScraperJunction to storage cortex");
storage.use("scraper", ScraperJunction);


async function tests() {

  logger.info("=== scraper dull");
  await dull({
    source: {
      smt: "scraper|connection string|foo_schema|*",
      pattern: {
        match: {
          Foo: 'twenty'
        }
      },
      options: {
        logger: logger
      }
    }
  });

}

tests();
