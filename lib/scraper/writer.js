/**
 * redshift/writer
 */
"use strict";

const { StorageWriter, StorageError } = require('@dictadata/storage-junctions');


module.exports = class RedshiftWriter extends StorageWriter {

  /**
   *
   * @param {*} storageJunction
   * @param {*} options
   */
  constructor(storageJunction, options = null) {
    super(storageJunction, options);
  }

  async _write(construct, encoding, callback) {
    this._logger.debug("RedshiftWriter _write");
    this._logger.debug(JSON.stringify(construct));

    try {
      // save construct to .schema
      await this._junction.store(construct);

      callback();
    }
    catch (err) {
      this._logger.error(err.message);
      callback(err);
    }

  }

  async _writev(chunks, callback) {
    this._logger.debug("RedshiftWriter _writev");

    try {
      for (var i = 0; i < chunks.length; i++) {
        let construct = chunks[i].chunk;
        //let encoding = chunks[i].encoding;  // string encoding

        // save construct to .schema
        await this._junction.store(construct);
      }
      callback();
    }
    catch (err) {
      this._logger.error(err.message);
      callback(err);
    }
  }

  _final(callback) {

    try {
      // close connection, cleanup resources, ...
    }
    catch(err) {
      this._logger.error(err.message);
      callback(new StorageError({statusCode: 500, _error: err}, 'Error storing construct'));
    }
    callback();
  }

};
