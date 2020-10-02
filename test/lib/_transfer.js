/**
 * test/lib/transfer
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const logger = require('../../lib/logger');

const fs = require('fs');
const stream = require('stream');
const util = require('util');
const pipeline = util.promisify(stream.pipeline);

module.exports = exports = async function (tract) {
  logger.verbose("=== transfer");
  let origin = Object.assign({}, tract.origin, tract.origin);
  let terminal = Object.assign({}, tract.terminal, tract.terminal);
  let transforms = Object.assign({}, tract.transforms, tract.transforms);

  logger.info(">>> create junction");
  logger.verbose("smt:" + JSON.stringify(tract.origin.smt, null, 2));
  if (tract.origin.options)
    logger.verbose("options:" + JSON.stringify(tract.origin.options));

  var junction;
  var jt;  // junction terminal
  try {
    logger.info(">>> create junctions");
    junction = await storage.activate(tract.origin.smt, tract.origin.options);

    logger.info("=== get list of desired files");
    let list = await junction.list();

    logger.debug(">>> get origin encoding");
    // load encoding from origin for validation
    let encoding = origin.encoding;
    if (typeof encoding === "string")
      encoding = JSON.parse(fs.readFileSync(encoding, "utf8"));
    if (typeof encoding === "object")
      encoding = await junction.putEncoding(encoding);
    else
      encoding = await junction.getEncoding();

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
    pipes.push(junction.getReadStream({ link: list[0].href }));
    for (let [tfType, tfOptions] of Object.entries(transforms))
      pipes.push(junction.getTransform(tfType, tfOptions));
    pipes.push(jt.getWriteStream());

    await pipeline(pipes);

    logger.info(">>> completed");
  }
  catch (err) {
    logger.error('!!! transfer failed: ' + err.message);
  }
  finally {
    if (junction) junction.relax();
    if (jt) await jt.relax();
  }

}
