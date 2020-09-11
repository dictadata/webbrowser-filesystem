/**
 * test/scraper/encoding
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const ScraperJunction = require("../../lib/scraper");

const getEncoding = require('../lib/_getEncoding');
const putEncoding = require('../lib/_putEncoding');
const logger = require('../logger');

logger.info("=== Test: scraper");

console.log("--- adding ScraperJunction to storage cortex");
storage.use("scraper", ScraperJunction);


async function tests() {

  logger.info("=== scraper putEncoding");
  await putEncoding({
    source: {
      smt: "scraper|connection string|foo_schema|*",
      options: {
        logger: logger
      }
    }
  });

  logger.info("=== scraper getEncoding");
  await getEncoding({
    source: {
      smt: "scraper|connection string|foo_schema|*",
      options: {
        logger: logger
      }
    },
    OutputFile: './test/output/scraper_foo_encoding.json'
  });

}

tests();
