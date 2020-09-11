/**
 * test/redshift/recall
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const RedshiftJunction = require("../../lib/redshift");

const recall = require('../lib/_recall');
const logger = require('../logger');

logger.info("=== Test: redshift");

console.log("--- adding RedshiftJunction to storage cortex");
storage.use("redshift", RedshiftJunction);


async function tests() {

  logger.info("=== redshift recall");
  await recall({
    source: {
      smt: "redshift|DSN=drewlab|foo_schema|=Foo",
      pattern: {
        match: {
          Foo: 'twenty'
        }
      },
      options: {
        logger: logger
      }
    }
  });

  logger.info("=== redshift recall");
  await recall({
    source: {
      smt: "redshift|DSN=drewlab|foo_schema|=Foo",
      pattern: {
        match: {
          Foo: 'ten'
        }
      },
      options: {
        logger: logger
      }
    }
  });

}

tests();
