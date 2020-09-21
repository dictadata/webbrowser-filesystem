/**
 * test/lib/download
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const logger = require('../../lib/logger');
const fs = require('fs');

module.exports = exports = class Download {

  constructor(tract) {
    this.tract = tract;
    this.junction = null;
  }

  async relax() {
    await this.junction.relax();
  }

  async list() {

    logger.info(">>> create junction");
    logger.verbose("smt:" + this.tract.origin.smt);
    if (this.tract.origin.options) logger.verbose("options:" + JSON.stringify(this.tract.origin.options));

    let list = [];

    try {
      this.junction = await storage.activate(this.tract.origin.smt, this.tract.origin.options);

      logger.info(">>> list");
      list = await this.junction.list();

      logger.debug("list: " + JSON.stringify(list, null, "  "));

      logger.info(">>> completed");
    }
    catch (err) {
      logger.error('!!! request failed: ' + err.message);
    }
    finally {

    }

    return list;
  }

  async getFile(filename) {
    let filesys = await this.junction.getFileSystem();

    await filesys.createReadStream({schema: filename});
  }
}
