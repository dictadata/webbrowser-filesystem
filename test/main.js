/**
 * test/scraper-junction
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const ScraperJunction = require("../lib/scraper");
const logger = require('./logger');

const stream = require('stream');
const util = require('util');

const pipeline = util.promisify(stream.pipeline);

console.log("=== Tests: ScraperJunction");

console.log("--- adding ScraperJunction to storage cortex");
storage.use("scraper", ScraperJunction);


async function testStream() {
  console.log("=== testStream");

  console.log(">>> create junction");
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

  console.log(">>> create streams");
  var reader = junction.getReadStream({});
  var writer = junction.getWriteStream({});

  //console.log(">>> start pipe");
  //await pipeline(reader,writer);

  await junction.relax();

  console.log(">>> completed");
}

async function tests() {
  await testStream();
}

tests();
