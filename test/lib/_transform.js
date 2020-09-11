/**
 * test/transform
 */
"use strict";

const storage = require('@dictadata/storage-junctions');
const Field = storage.Field;
const Types = storage.Types;
const logger = require('../logger');
const stream = require('stream');
const util = require('util');

const pipeline = util.promisify(stream.pipeline);

module.exports = async function (options) {

  logger.info(">>> create junctions");
  var j1 = storage.activate(options.source.smt, options.source.options);
  var j2 = storage.activate(options.destination.smt, options.destination.options);

  try {
    logger.debug(">>> get source encoding (codify)");
    let encoding = await j1.getEncoding();

    for (let [name,value] of Object.entries(options.transforms.inject)) {
      encoding.add(new Field({name: name, type: Types.storageType(value)}));
    }

    logger.debug(">>> encoding results");
    logger.debug(JSON.stringify(encoding.fields));

    logger.debug(">>> put destination encoding");
    let result_encoding = await j2.putEncoding(encoding);
    if (!result_encoding)
      logger.info("could not create storage schema, maybe it already exists");

    logger.info(">>> create streams");
    var reader = j1.getReadStream();
    var transform = j1.getTransform(options.transforms);
    var writer = j2.getWriteStream();

    logger.info(">>> start pipe");
    await pipeline(reader, transform, writer);

    logger.info(">>> completed");
  }
  catch (err) {
    logger.error('!!! request failed: ' + err.message);
  }
  finally {
    await j1.relax();
    await j2.relax();
  }

};
