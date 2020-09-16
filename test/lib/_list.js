/**
 * test/list
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const logger = require('../../lib/logger');
const fs = require('fs');

module.exports = exports = async function (tract) {

  logger.info(">>> create junction");
  logger.verbose("smt:" + tract.origin.smt);
  if (tract.origin.options) logger.verbose("options:" + JSON.stringify(tract.origin.options));

  var jo;
  try {
    jo = await storage.activate(tract.origin.smt, tract.origin.options);
    logger.info(">>> list");
    let list = await jo.list();

    logger.debug("list: " + JSON.stringify(list, null, "  "));
    if (tract.terminal) {
      logger.info(">>> save encoding to " + tract.terminal);
      fs.writeFileSync(tract.terminal, JSON.stringify(list,null,"  "), "utf8");
    }

    logger.info(">>> completed");
  }
  catch (err) {
    logger.error('!!! request failed: ' + err.message);
  }
  finally {
    await jo.relax();
  }

};
