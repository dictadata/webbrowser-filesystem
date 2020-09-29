/**
 * test/webbrowser/list
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const WebBrowserFileSystem = require("../../lib/filesystems/webbrowser-filesystem")

const list = require('../lib/_list');
const logger = require('../../lib/logger');

logger.info("=== tests: webbrowser list");

logger.info("--- adding WebBrowserFileSystem to storage cortex");
storage.FileSystems.use("http", WebBrowserFileSystem);


async function test_1() {

  logger.info("=== list webbrowser directory (forEach)");
  await list({
    origin: {
      smt: "json|http://localhost/test/data/|*.json|*",
      options: {
        recursive: false,
        forEach: (entry) => {
          logger.info("- " + entry.name);
        }
      }
    },
    terminal: "./test/output/webbrowse_list_1.json"
  });
}

async function test_2() {

  logger.info("=== list webbrowser directory (recursive)");
  await list({
    origin: {
      smt: {
        model: "json",
        locus: "http://localhost/test/",
        schema: "*.json",
        key: "*"
      },
      options: {
        schema: "foofile_*.json",
        recursive: true
      }
    },
    terminal: "./test/output/webbrowse_list_2.json"
  });

}

async function test_3() {

  logger.info("=== list webbrowser directory (recursive)");
  await list({
    origin: {
      smt: {
        model: "shp",
        locus: "http://ec2-3-208-205-6.compute-1.amazonaws.com/shapefiles/",
        schema: "*.shp",
        key: "*"
      },
      options: {
        schema: "*.shp",
        recursive: true
      }
    },
    terminal: "./test/output/webbrowse_list_3.json"
  });

}

(async () => {
  await test_1();
  await test_2();
  await test_3();
})();
