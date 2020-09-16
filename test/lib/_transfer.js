/**
 * test/transfer
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const logger = require('../../lib/logger');

const fs = require('fs');
const stream = require('stream');
const util = require('util');
const pipeline = util.promisify(stream.pipeline);

/**
 * transfer fucntion
 */
module.exports = exports = async function (tract) {

  var jo, jt;  // junctions origin, terminal
  try {
    logger.info(">>> create junctions");
    jo = await storage.activate(tract.origin.smt, tract.origin.options);
    let transforms = tract.transforms || {};

    logger.debug(">>> get origin encoding");
    // load encoding from origin for validation
    let encoding = tract.origin.encoding;
    if (typeof encoding === "string")
      encoding = JSON.parse(fs.readFileSync(encoding, "utf8"));
    if (typeof encoding === "object")
      encoding = await jo.putEncoding(encoding);
    else
      encoding = await jo.getEncoding();

    logger.debug("create the terminal");
    jt = await storage.activate(tract.terminal.smt, tract.terminal.options);

    if (tract.terminal.encoding) {
      // use configured encoding
      encoding = tract.terminal.encoding;
      if (typeof encoding === "string")
        encoding = JSON.parse(fs.readFileSync(encoding, "utf8"));
    }
    else {
      // run some objects through any transforms to get terminal encoding
      logger.verbose("build codify pipeline");
      let pipes = [];
      pipes.push(jo.getReadStream({ max_read: 100 }));
      for (let [tfType,tfOptions] of Object.entries(transforms))
        pipes.push(jo.getTransform(tfType, tfOptions));
      let ct = jo.getTransform('codify');
      pipes.push(ct);
      await pipeline(pipes);
      encoding = await ct.getEncoding();
    }
    logger.debug(">>> encoding results");
    logger.debug(JSON.stringify(encoding.fields, null, " "));

    logger.verbose(">>> put terminal encoding");
    encoding = await jt.putEncoding(encoding);
    if (typeof encoding !== "object")
      logger.info("could not create storage schema: " + encoding);

    // transfer the data
    logger.info(">>> transfer pipeline");
    let pipes = [];
    pipes.push(jo.getReadStream());
    for (let [tfType,tfOptions] of Object.entries(transforms))
      pipes.push(jo.getTransform(tfType, tfOptions));
    pipes.push(jt.getWriteStream());

    await pipeline(pipes);

    logger.info(">>> completed");
  }
  catch (err) {
    logger.error('!!! transfer failed: ' + err.message);
  }
  finally {
    if (jo) await jo.relax();
    if (jt) await jt.relax();
  }

};
