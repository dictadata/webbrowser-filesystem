/**
 * test/webbrowser-filesystem
 * 
 * TO DO: rework this test to use a WebBrowserFileSystem
 * 
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const WebBrowserFileSystem = require("../lib/webbrowser");
const logger = require('./logger');

const stream = require('stream');
const util = require('util');

const pipeline = util.promisify(stream.pipeline);

logger.info("=== Tests: WebBrowserFileSystem");

logger.info("--- adding WebBrowserFileSystem to storage cortex");
storage.FileSystems.use("http", WebBrowserFileSystem);


async function testStream() {
  logger.info("=== testStream");

  logger.info(">>> create junction");
  var junction = storage.activate({
    smt: {
      model: "webbrowser",
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
