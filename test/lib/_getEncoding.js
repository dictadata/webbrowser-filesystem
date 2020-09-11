/**
 * test/getEncoding
 */
"use strict";

const storage = require('@dictadata/storage-junctions');
const logger = require('../logger');
const fs = require('fs');

module.exports = async function (options) {

  logger.info(">>> create junction");
  var junction = storage.activate(options.source.smt, options.source.options);

  try {
    let encoding = await junction.getEncoding();
    if (typeof encoding === 'object') {
      logger.verbose(JSON.stringify(encoding));

      if (options.OutputFile) {
        fs.writeFileSync(options.OutputFile, JSON.stringify(encoding,null,"  "));
        logger.verbose(options.OutputFile);
      }
    }
    else
      logger.warn("storage schema was: " + encoding);

    logger.info(">>> completed");
  }
  catch (err) {
    logger.error('!!! request failed: ' + err.message);
  }
  finally {
    await junction.relax();
  }

};
