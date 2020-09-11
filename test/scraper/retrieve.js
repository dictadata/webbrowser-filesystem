/**
 * test/scraper/retrieve
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const ScraperJunction = require("../../lib/scraper");

const retrieve = require('../lib/_retrieve');
const logger = require('../logger');

logger.info("=== Test: scraper");

console.log("--- adding ScraperJunction to storage cortex");
storage.use("scraper", ScraperJunction);


async function tests() {

  logger.info("=== scraper retrieve");
  await retrieve({
    source: {
      smt: "scraper|connection string|foo_schema|*",
      pattern: {
        match: {
          "Foo": 'twenty'
        }
      },
      options: {
        logger: logger
      }
    }
  });

  logger.info("=== scraper retrieve with pattern");
  await retrieve({
    source: {
      smt: "scraper|connection string|foo_transfer|*",
      pattern: {
        match: {
          "Foo": "first",
          "Baz": { "gte": 0, "lte": 1000 }
        },
        cues: {
          count: 3,
          order: { "Dt Test": "asc" },
          fields: ["Foo","Baz"]
        }
      },
      options: {
        logger: logger
      }
    }
  });

}

tests();
