/**
 * test/scraper/transfers
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const ScraperFileSystem = require("../../lib/filesystems/scraper-filesystem")

const transfer = require('../lib/_transfer');
const logger = require('../../lib/logger');

logger.info("=== Test: gzip transfers");

logger.info("--- adding ScraperFileSystem to storage cortex");
storage.FileSystems.use("http", ScraperFileSystem);

async function tests() {
  logger.verbose("=== scraper downloads");

  logger.verbose('=== scraper_output.csv');
  await transfer({
    origin: {
      smt: "csv|http://localhost/test/data/|foofile.csv.gz|*",
      options: {
      }
    },
    terminal: {
      smt: "csv|./test/output/|scraper_output.csv|*"
    }
  });

  logger.verbose('=== scraper_output.csv.gz');
  await transfer({
    origin: {
      smt: "csv|http://localhost/test/data/|foofile.csv|*",
      options: {
      }
    },
    terminal: {
      smt: "csv|./test/output/|scraper_output.csv.gz|*"
    }
  });

  logger.verbose('=== scraper_output.json');
  await transfer({
    origin: {
      smt: "json|http://localhost/test/data/|foofile.json.gz|*",
      options: {
      }
    },
    terminal: {
      smt: "json|./test/output/|scraper_output.json|*"
    }
  });

  logger.verbose('=== scraper_output.json.gz');
  await transfer({
    origin: {
      smt: "json|http://localhost/test/data/|foofile.json|*",
      options: {
      }
    },
    terminal: {
      smt: "json|./test/output/|scraper_output.json.gz|*"
    }
  });

}

tests();
