/**
 * test/redshift/transfer
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const RedshiftJunction = require("../../lib/redshift");

const transfer = require('../lib/_transfer');
const logger = require('../logger');

logger.info("=== Test: redshift");

console.log("--- adding RedshiftJunction to storage cortex");
storage.use("redshift", RedshiftJunction);


async function tests() {

  logger.info("=== redshift writer");
  await transfer({
    source: {
      smt: "csv|./test/data/|foofile.csv|*",
      options: {
        logger: logger
      }
    },
    destination: {
      smt: "redshift|DSN=drewlab|foo_transfer|*",
      options: {
        logger: logger
      }
    }
  });

  logger.info("=== redshift reader");
  await transfer({
    source: {
      smt: "redshift|DSN=drewlab|foo_transfer|*",
      options: {
        logger: logger
      }
    },
    destination: {
      smt: "csv|./test/output/|redshift_output.csv|*",
      options: {
        logger: logger
      }
    }
  });
}

tests();
