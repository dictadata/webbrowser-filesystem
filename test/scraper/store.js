/**
 * test/scraper/store
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const ScraperJunction = require("../../lib/scraper");

const store = require('../lib/_store');
const logger = require('../logger');

logger.info("=== Test: scraper");

console.log("--- adding ScraperJunction to storage cortex");
storage.use("scraper", ScraperJunction);


async function tests() {

  logger.info("=== scraper store 20");
  await store({
    source: {
      smt: "scraper|connection string|foo_schema|=Foo",
      options: {
        logger: logger
      }
    },
    construct: {
      Foo: 'twenty',
      Bar: 'Jackson',
      Baz: 20
    }
  });

  logger.info("=== scraper store 30");
  await store({
    source: {
      smt: "scraper|connection string|foo_schema|=Foo",
      options: {
        logger: logger
      }
    },
    construct: {
      Foo: 'twenty',
      Bar: 'Jackson',
      Baz: 30,
      enabled: false
    }
  });

  logger.info("=== scraper store 10");
  await store({
    source: {
      smt: "scraper|connection string|foo_schema|=Foo",
      options: {
        logger: logger
      }
    },
    construct: {
      Foo: 'ten',
      Bar: 'Hamilton',
      Baz: 10,
      enabled: false
    }
  });

}

tests();
