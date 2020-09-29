/**
 * test/webbrowser/transfer
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const WebBrowserFileSystem = require("../../lib/filesystems/webbrowser-filesystem")

const WebBrowser = require('../lib/_webbrowser');
const logger = require('../../lib/logger');

logger.info("=== Test: webbrowser transfers");

logger.info("--- adding WebBrowserFileSystem to storage cortex");
storage.FileSystems.use("http", WebBrowserFileSystem);


async function test_1() {
  logger.verbose("=== test_1 - tranfer csv files");

  let webbrowser = new WebBrowser({
    origin: {
      smt: "csv|http://localhost/test/data/|*|*",
      options: {
        recursive: false
      },
      encoding: './test/data/foo_encoding.json'
    }
  });

  logger.info("=== webbrowser load HTML page");
  let list = await webbrowser.loadPage();

  logger.verbose('=== webbrowser_output.csv');
  await webbrowser.transfer({
    origin: {
      link: "/test/data/foofile.csv.gz"
    },
    terminal: {
      smt: "csv|./test/output/|webbrowser_output.csv|*"
    }
  });

  logger.verbose('=== webbrowser_output.csv.gz');
  await webbrowser.transfer({
    origin: {
      link: "/test/data/foofile.csv"
    },
    terminal: {
      smt: "csv|./test/output/|webbrowser_output.csv.gz|*"
    }
  });

  await webbrowser.relax();
}

async function test_2() {
  logger.verbose("=== test_2 - tranfer json files");

  let webbrowser = new WebBrowser({
    origin: {
      smt: "json|http://localhost/test/data/|*.json|*",
      options: {
        recursive: false
      },
      encoding: './test/data/foo_encoding.json'
    }
  });

  logger.info("=== webbrowser load HTML page");
  let list = await webbrowser.loadPage();

  logger.verbose('=== webbrowser_output.json');
  await webbrowser.transfer({
    origin: {
      link: "/test/data/foofile.json.gz"
    },
    terminal: {
      smt: "json|./test/output/|webbrowser_output.json|*"
    }
  });

  logger.verbose('=== webbrowser_output.json.gz');
  await webbrowser.transfer({
    origin: {
      link: "/test/data/foofile.json"
    },
    terminal: {
      smt: "json|./test/output/|webbrowser_output.json.gz|*"
    }
  });

  await webbrowser.relax();
}


(async () => {
  await test_1();
  await test_2();
})();
