/**
 * test/scraper/list
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const ScraperFileSystem = require("../../lib/filesystems/scraper-filesystem")

const list = require('../lib/_list');
const logger = require('../../lib/logger');

logger.info("=== tests: scraper list");

logger.info("--- adding ScraperFileSystem to storage cortex");
storage.FileSystems.use("http", ScraperFileSystem);

async function tests() {

  logger.info("=== list scraper directory (forEach)");
  await list({
    origin: {
      smt: "json|http://localhost/test/data/|*.json|*",
      options: {
        recursive: false,
        forEach: (name) => {
          logger.info("- " + name);
        }
      }
    },
    terminal: "./test/output/scraper_list_1.json"
  });

  logger.info("=== list scraper directory (recursive)");
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
    terminal: "./test/output/scraper_list_2.json"
  });

  logger.info("=== list scraper directory (recursive)");
  await list({
    origin: {
      smt: {
        model: "json",
        locus: "http://ec2-3-208-205-6.compute-1.amazonaws.com/shapefiles/",
        schema: "*.shp",
        key: "*"
      },
      options: {
        schema: "*.shp",
        recursive: true
      }
    },
    terminal: "./test/output/scraper_list_3.json"
  });

}

tests();
