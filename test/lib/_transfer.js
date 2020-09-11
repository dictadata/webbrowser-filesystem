/**
 * test/transfer
 */
"use strict";

const storage = require('@dictadata/storage-junctions');
const logger = require('../logger');
const stream = require('stream');
const util = require('util');

const pipeline = util.promisify(stream.pipeline);

/**
 * transfer fucntion
 */
module.exports = async function (options) {

  logger.info(">>> create junctions");
  var j1 = storage.activate(options.source.smt, options.source.options);
  var j2 = storage.activate(options.destination.smt, options.destination.options);

  try {
    logger.info(">>> get source encoding (codify)");
    let encoding = await j1.getEncoding();

    logger.debug(">>> encoding results:");
    logger.debug(JSON.stringify(encoding));

    logger.info(">>> put destination encoding");
    let result_encoding = await j2.putEncoding(encoding);
    if (!result_encoding)
      logger.warn("could not create storage schema, maybe it already exists");

    logger.info(">>> create streams");
    var reader = j1.getReadStream(options.reader);
    var writer = j2.getWriteStream(options.writer);

    logger.info(">>> start pipe");
    await pipeline(reader, writer);

    logger.info(">>> completed");
  }
  catch (err) {
    logger.error('!!! request failed: ' + err.message);
  }
  finally {
    await j1.relax();
    await j2.relax();
  }

};
