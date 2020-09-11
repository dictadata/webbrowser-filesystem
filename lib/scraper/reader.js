/**
 * redshift/reader
 */
"use strict";

const { StorageReader } = require('@dictadata/storage-junctions');


module.exports = class RedshiftReader extends StorageReader {

  /**
   *
   * @param {*} storageJunction
   * @param {*} options
   */
  constructor(storageJunction, options = null) {
    super(storageJunction, options);
  }

  /**
   * Fetch data from the underlying resource.
   * @param {*} size <number> Number of bytes to read asynchronously
   */
  async _read(size) {
    this._logger.debug('RedshiftReader _read');

    // read up to size constructs
    try {
      let results = await this._junction.pool.query('SELECT * FROM ' + this._engram.smt.schema + ';');

      for (let i = 0; i < results.length; i++)
        this.push(results[i]);

      // when done reading from source
      this.push(null);
    }
    catch (err) {
      this._logger.error(err.message);
      this.push(null);
    }

  }

};
