/**
 * test/scan
 */
"use strict";

const storage = require('@dictadata/storage-junctions');
const logger = require('../logger');

module.exports = async function (options) {

  logger.info(">>> create junction");
  var j1 = storage.activate(options.source.smt, options.source.options);

  try {
    logger.info(">>> scan");
    let list = await j1.scan(options.scan);

    logger.verbose("list: " + JSON.stringify(list, null, "  "));

    logger.info(">>> completed");
  }
  catch (err) {
    logger.error('!!! request failed: ' + err.message);
  }
  finally {
    await j1.relax();
  }

};
