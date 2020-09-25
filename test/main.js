/**
 * test/scraper-filesystem
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const ScraperJunction = require("../lib/scraper");
const logger = require('./logger');

const stream = require('stream');
const util = require('util');

const pipeline = util.promisify(stream.pipeline);

logger.info("=== Tests: ScraperJunction");

logger.info("--- adding ScraperJunction to storage cortex");
storage.use("scraper", ScraperJunction);


async function testStream() {
  logger.info("=== testStream");

  logger.info(">>> create junction");
  var junction = storage.activate({
    smt: {
      model:"scraper",
      locus: "somewhere",
      schema: "container",
      key: "*"
    }
  }, {
    logger: logger
  });

  logger.info(">>> create streams");
  var reader = junction.getReadStream({});
  var writer = junction.getWriteStream({});

  //logger.info(">>> start pipe");
  //await pipeline(reader,writer);

  await junction.relax();

  logger.info(">>> completed");
}

async function tests() {
  await testStream();
}

tests();
