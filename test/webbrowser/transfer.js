/**
 * test/webbrowser/transfer
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const WebBrowserFileSystem = require("../../lib/filesystems/webbrowser-filesystem")

const transfer = require('../lib/_transfer');
const logger = require('../../lib/logger');

logger.info("=== Test: webbrowser transfers");

logger.info("--- adding WebBrowserFileSystem to storage cortex");
storage.FileSystems.use("http", WebBrowserFileSystem);


async function test_1() {
  logger.verbose("=== test_1 - tranfer csv files");

  await transfer({
    origin: {
      smt: "csv|http://localhost/test/data/|foofile.csv.gz|*",
      options: {
        recursive: false
      },
      encoding: './test/data/foo_encoding.json'
    },
    terminal: {
      smt: "csv|./test/output/|webbrowser_output.csv|*"
    }
  });

  await transfer({
    origin: {
      smt: "csv|http://localhost/test/data/|foofile.csv|*",
      options: {
        recursive: false
      },
      encoding: './test/data/foo_encoding.json'
    },
    terminal: {
      smt: "csv|./test/output/|webbrowser_output.csv.gz|*"
    }
  });

}

async function test_2() {
  logger.verbose("=== test_2 - tranfer json files");

  await transfer({
    origin: {
      smt: "json|http://localhost/test/data/|foofile.json.gz|*",
      options: {
        recursive: false
      },
      encoding: './test/data/foo_encoding.json'
    },
    terminal: {
      smt: "json|./test/output/|webbrowser_output.json|*"
    }
  });

  await transfer({
    origin: {
      smt: "json|http://localhost/test/data/|foofile.json|*",
      options: {
        recursive: false
      },
      encoding: './test/data/foo_encoding.json'
    },
    terminal: {
      smt: "json|./test/output/|webbrowser_output.json.gz|*"
    }
  });

}


(async () => {
  await test_1();
  await test_2();
})();
