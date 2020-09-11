/**
 * test/redshift/encoding
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const RedshiftJunction = require("../../lib/redshift");

const getEncoding = require('../lib/_getEncoding');
const putEncoding = require('../lib/_putEncoding');
const logger = require('../logger');

logger.info("=== Test: redshift");

console.log("--- adding RedshiftJunction to storage cortex");
storage.use("redshift", RedshiftJunction);


async function tests() {

  logger.info("=== redshift putEncoding");
  await putEncoding({
    source: {
      smt: "redshift|DSN=drewlab|foo_schema|*",
      options: {
        logger: logger
      }
    }
  });

  logger.info("=== redshift getEncoding");
  await getEncoding({
    source: {
      smt: "redshift|DSN=drewlab|foo_schema|*",
      options: {
        logger: logger
      }
    },
    OutputFile: './test/output/redshift_foo_encoding.json'
  });

}

tests();
