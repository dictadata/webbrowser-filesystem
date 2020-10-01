/**
 * test/lib/download
 * 
 * download uses the browser to download file(s) directly to a local folder.
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const logger = require('../../lib/logger');

const fs = require('fs');
const stream = require('stream');
const util = require('util');
const pipeline = util.promisify(stream.pipeline);

module.exports = exports = async function (tract) {

  logger.info(">>> create junction");
  logger.verbose("smt:" + JSON.stringify(tract.origin.smt, null, 2));
  if (tract.origin.options) logger.verbose("options:" + JSON.stringify(tract.origin.options));

  var junction;
  try {
    logger.info("=== webbrowser load directory page");
    junction = await storage.activate(tract.origin.smt, tract.origin.options);
    let list = await junction.list();

    logger.info("=== webbrowser download files");
    let fs = await junction.getFileSystem();

    for (let entry of list) {
      logger.verbose(JSON.stringify(entry, null, 2));

      let options = Object.assign(entry, {
        saveFiles: true,
        saveFolder: tract.terminal || './'
      });
      let ok = await fs.download(options);
      if (!ok)
        logger.error("download failed: " + entry.href);
    }
  }
  catch (err) {
    logger.error('!!! request failed: ' + err.message);
  }
  finally {
    await junction.relax();
  }

}
