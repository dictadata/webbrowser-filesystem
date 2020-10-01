/**
 * test/webbrowser/download
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const WebBrowserFileSystem = require("../../lib/filesystems/webbrowser-filesystem")

const download = require('../lib/_download');
const logger = require('../../lib/logger');

logger.info("=== tests: webbrowser downloads");

logger.info("--- adding WebBrowserFileSystem to storage cortex");
storage.FileSystems.use("http", WebBrowserFileSystem);


async function test_1() {
  logger.info("=== download from HTML directory page");

  logger.verbose("--- create webbrowser");
  await download({
    origin: {
      smt: "csv|http://localhost/test/data/|*.csv|*",
      options: {
        recursive: false,
        saveFiles: true
      }
    },
    terminal: "./test/output/downloads/"
  });
}

async function test_2() {
  logger.info("=== download shape files");

  logger.verbose("--- create webbrowser");
  await download({
    origin: {
      smt: "shp|http://ec2-3-208-205-6.compute-1.amazonaws.com/shapefiles/|*.*|*",
      options: {
        recursive: true,
        saveFiles: true,
        savePaths: true
      }
    },
    terminal: "./test/output/shapefiles/"
  });
}

(async () => {
  await test_1();
  await test_2();
})();
