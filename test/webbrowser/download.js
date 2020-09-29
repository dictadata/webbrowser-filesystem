/**
 * test/webbrowser/download
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const WebBrowserFileSystem = require("../../lib/filesystems/webbrowser-filesystem")

const WebBrowser = require('../lib/_webbrowser');
const logger = require('../../lib/logger');

logger.info("=== tests: webbrowser downloads");

logger.info("--- adding WebBrowserFileSystem to storage cortex");
storage.FileSystems.use("http", WebBrowserFileSystem);


async function test_1() {
  logger.info("=== download from HTML directory page");

  logger.verbose("--- create webbrowser");
  let webbrowser = new WebBrowser({
    origin: {
      smt: "csv|http://localhost/test/data/|*.csv|*",
      options: {
        recursive: false,
        saveFiles: true
      }
    },
    terminal: "./test/output/downloads/"
  });

  logger.info("=== webbrowser load directory page");
  let list = await webbrowser.loadPage();

  logger.info("=== webbrowser download files");
  for (let entry of list) {
    logger.verbose(JSON.stringify(entry, null, 2));
    await webbrowser.downloadFile(entry);
  }

  await webbrowser.relax();
}

async function test_2() {
  logger.info("=== download shape files");

  logger.verbose("--- create webbrowser");
  let webbrowser = new WebBrowser({
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

  logger.info("=== webbrowser load directory page");
  let list = await webbrowser.loadPage();

  logger.info("=== webbrowser download files");
  for (let entry of list) {
    logger.verbose(JSON.stringify(entry, null, 2));
    await webbrowser.downloadFile(entry);
  }

  await webbrowser.relax();
}


(async () => {
  await test_1();
  await test_2();
})();
