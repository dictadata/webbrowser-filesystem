/**
 * test/scraper/transfer
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const ScraperFileSystem = require("../../lib/filesystems/scraper-filesystem")

const scraper = require('../lib/_scraper');
const logger = require('../../lib/logger');

logger.info("=== Test: scraper transfers");

logger.info("--- adding ScraperFileSystem to storage cortex");
storage.FileSystems.use("http", ScraperFileSystem);


async function test_1() {
  logger.verbose("=== test_1 - tranfer csv files");

  let scraper = new Scraper({
    origin: {
      smt: "csv|http://localhost/test/data/|*.csv|*",
      options: {
        recursive: false,
        forEach: (name) => {
          logger.info("- " + name);
        }
      },
      encoding: './test/data/foo_encoding.json'
    },
    terminal: ""
  });

  logger.info("=== scraper load HTML page");
  let list = await scraper.loadPage();
  
  logger.verbose('=== scraper_output.csv');
  await scraper.transfer({
    origin: {
      schema: "foofile.csv.gz",
      options: {
      }
    },
    terminal: {
      smt: "csv|./test/output/|scraper_output.csv|*"
    }
  });

  logger.verbose('=== scraper_output.csv.gz');
  await scraper.transfer({
    origin: {
      schema: "foofile.csv",
      options: {
      }
    },
    terminal: {
      smt: "csv|./test/output/|scraper_output.csv.gz|*"
    }
  });

}


async function test_2() {
  logger.verbose("=== test_2 - tranfer json files");

  let scraper = new Scraper({
    origin: {
      smt: "json|http://localhost/test/data/|*.json|*",
      options: {
        recursive: false,
        forEach: (name) => {
          logger.info("- " + name);
        }
      },
      encoding: './test/data/foo_encoding.json'
    },
    terminal: ""
  });

  logger.info("=== scraper load HTML page");
  let list = await scraper.loadPage();
  
  logger.verbose('=== scraper_output.json');
  await scraper.transfer({
    origin: {
      schema: "foofile.json.gz",
      options: {
      }
    },
    terminal: {
      smt: "json|./test/output/|scraper_output.json|*"
    }
  });

  logger.verbose('=== scraper_output.json.gz');
  await scraper.transfer({
    origin: {
      schema: "foofile.json",
      options: {
      }
    },
    terminal: {
      smt: "json|./test/output/|scraper_output.json.gz|*"
    }
  });

}


(async () => {
  await test_1();
  await test_2();
})();
