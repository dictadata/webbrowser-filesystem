/**
 * test/recall
 */
"use strict";

const storage = require('@dictadata/storage-junctions');
const logger = require('../logger');

module.exports = async function (options) {

  logger.info(">>> create junction");
  logger.verbose(options.source.smt);
  logger.verbose(JSON.stringify(options.source.pattern));

  var junction = storage.activate(options.source.smt, options.source.options);

  try {
    let results = await junction.recall(options.source.pattern);
    logger.verbose(JSON.stringify(results));

    logger.info(">>> completed");
  }
  catch (err) {
    logger.error('!!! request failed: ' + err.message);
  }
  finally {
    await junction.relax();
  }

};
