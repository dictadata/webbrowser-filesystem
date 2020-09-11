/**
 * test/store
 */
"use strict";

const storage = require('@dictadata/storage-junctions');
const logger = require('../logger');

module.exports = async function (options) {

  logger.info(">>> create junction");
  logger.verbose(options.source.smt);
  logger.verbose("options: " + JSON.stringify(options.source.pattern));

  var junction = storage.activate(options.source.smt, options.source.options);

  try {
    let results = await junction.store(options.construct, options.source.pattern);
    logger.verbose(JSON.stringify(results));

    logger.info(">>> completed");
    return results.keys ? results.keys : null;
  }
  catch (err) {
    if (err.statusCode < 500)
      logger.warn(err.message);
    else
      logger.error('!!! request failed: ' + err.message);
  }
  finally {
    await junction.relax();
  }

};
