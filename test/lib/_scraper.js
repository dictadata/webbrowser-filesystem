/**
 * test/lib/download
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const logger = require('../../lib/logger');

const fs = require('fs');
const stream = require('stream');
const util = require('util');
const pipeline = util.promisify(stream.pipeline);

module.exports = exports = class Download {

  constructor(tract) {
    this.tract = tract;
    this.junction = null;
  }

  async relax() {
    await this.junction.relax();
  }

  /**
   * junction.list() must be called before downloading files
   * even if it does not return a file list.
   * list will load the containing web page in the headless browser
   * as it will be used to "click" on hyperlinks in anchor tags or
   * form actions.
   * The tag for each file's hyperlink must be identifiable with a
   * HTML DOM selector.
   */
  async loadPage() {
    logger.verbose("=== scraper.loadPage");

    logger.info(">>> create junction");
    logger.verbose("smt:" + this.tract.origin.smt);
    if (this.tract.origin.options)
      logger.verbose("options:" + JSON.stringify(this.tract.origin.options));

    let list = [];

    try {
      logger.info(">>> create junctions");
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

  /**
   * downloadFile uses the browser to download a file directly to a local folder.
   * 
   * @param {*} filename 
   */
  async downloadFile(entry) {
    logger.verbose("=== scraper.downloadFile");
    let fs = await this.junction.getFileSystem();

    let options = Object.assign(entry, {
      saveFiles: true,
      saveFolder: this.tract.terminal || './'
    });
    let ok = await fs.download(options);

    if (!ok)
      logger.error("download failed: " + entry.href);
  }

  /**
   * transfer uses the readStream to pipe the file contents.
   * 
   * @param {*} options
   */
  async transfer(options) {
    logger.verbose("=== scraper.transfer");
    let origin = Object.assign({}, this.tract.origin, options.origin);
    let terminal = Object.assign({}, this.tract.terminal, options.terminal);
    let transforms = Object.assign({}, this.tract.transforms, options.transforms);

    let rs = this.junction.getReadStream({ link: origin.link });

    var jt;  // junction terminal
    try {
      logger.debug(">>> get origin encoding");
      // load encoding from origin for validation
      let encoding = origin.encoding;
      if (typeof encoding === "string")
        encoding = JSON.parse(fs.readFileSync(encoding, "utf8"));
      if (typeof encoding === "object")
        encoding = await this.junction.putEncoding(encoding);
      else
        encoding = await this.junction.getEncoding();

      logger.debug("create the terminal");
      jt = await storage.activate(terminal.smt, terminal.options);

      if (terminal.encoding) {
        // use configured encoding
        encoding = terminal.encoding;
        if (typeof encoding === "string")
          encoding = JSON.parse(fs.readFileSync(encoding, "utf8"));
      }
      // else use origin encoding
      logger.debug(">>> encoding results");
      logger.debug(JSON.stringify(encoding.fields, null, " "));

      logger.verbose(">>> put terminal encoding");
      encoding = await jt.putEncoding(encoding);
      if (typeof encoding !== "object")
        logger.info("could not create storage schema: " + encoding);

      // transfer the data
      logger.info(">>> transfer pipeline");
      let pipes = [];
      pipes.push(this.junction.getReadStream({ link: origin.link }));
      for (let [tfType, tfOptions] of Object.entries(transforms))
        pipes.push(this.junction.getTransform(tfType, tfOptions));
      pipes.push(jt.getWriteStream());

      await pipeline(pipes);

      logger.info(">>> completed");
    }
    catch (err) {
      logger.error('!!! transfer failed: ' + err.message);
    }
    finally {
      if (jt) await jt.relax();
    }

  }

}
