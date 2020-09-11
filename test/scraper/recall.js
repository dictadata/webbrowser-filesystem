/**
 * test/scraper/recall
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const ScraperJunction = require("../../lib/scraper");

const recall = require('../lib/_recall');
const logger = require('../logger');

logger.info("=== Test: scraper");

console.log("--- adding ScraperJunction to storage cortex");
storage.use("scraper", ScraperJunction);


async function tests() {

  logger.info("=== scraper recall");
  await recall({
    source: {
      smt: "scraper|connection string|foo_schema|=Foo",
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

  logger.info("=== scraper recall");
  await recall({
    source: {
      smt: "scraper|connection string|foo_schema|=Foo",
      pattern: {
        match: {
          Foo: 'ten'
        }
      },
      options: {
        logger: logger
      }
    }
  });

}

tests();
