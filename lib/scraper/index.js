/**
 * scraper/junction
 */
"use strict";

const {
  StorageJunction, StorageResults, StorageError, Engram
} = require('@dictadata/storage-junctions');

const ScraperReader = require("./reader");
const ScraperWriter = require("./writer");
const encoder = require("./encoder");
const httpQuery = require("./httpQuery");


module.exports = class ScraperJunction extends StorageJunction {

  /**
   *
   * @param {*} SMT 'scraper|connection string|schema name|key' or an Engram object
   * @param {*} options
   */
  constructor(SMT, options = null) {
    super(SMT, options);
    this._logger.debug("ScraperJunction");

    this._readerClass = ScraperReader;
    this._writerClass = ScraperWriter;
  }

  /**
   * override to initialize junction
   */
  async activate() {
    this.isActive = true;

    //* acquire any resources
  }

  /**
   * override to release resources
   */
  async relax() {
    this._logger.debug("ScraperJunction relax");

    //* release any resources

  }

  /**
   *  Get the encoding for the storage node.
   *  Possibly make a call to the source to acquire the encoding definitions.
   */
  async getEncoding() {
    this._logger.debug("ScraperJunction getEncoding");

    try {
      //* fetch encoding form storage source

      // add/update storage fields
      //* loop through source data definition
      { 
        //* determine source field
        let srcField = {};

        // convert to dictadata storage field
        let field = encoder.storageField(srcField);

        // add/update engram
        this._engram.add(field);
      }

      return this._engram;
    }
    catch (err) {
      //* translate source errors as needed
      this._logger.error(err.message);
      throw err;
    }
  }

  /**
   * Sets the encoding for the storage node.
   * Possibly sending the encoding definitions to the source.
   * @param {*} encoding
   */
  async putEncoding(encoding) {
    this._logger.debug("ScraperJunction putEncoding");

    try {
      // check if entity already exists at source, if applicable

      // make a copy of the engram encoding 
      let engram = new Engram(this._engram);
      engram.replace(encoding);

      //* update the source, if applicable

      // if successful, update the instance's internal engram
      this._engram.replace(encoding);

      // return the updated engram
      return this._engram;
    }
    catch(err) {
      //* translate source errors as needed
      this._logger.error(err.message);
      throw err;
    }
  }

  /**
   * 
   * @param {*} construct the object to store
   * @param {*} pattern Should contain a meta key used to identify the construct
   *                     If null will insert a new construct into the source
   */
  async store(construct, pattern) {
    this._logger.debug("ScraperJunction store");

    if (this._engram.keyof === 'uid' || this._engram.keyof === 'key')
      throw new StorageError({ statusCode: 400 }, "unique keys not supported");
    if (typeof construct !== "object")
      throw new StorageError({statusCode: 400}, "Invalid parameter: construct is not an object");

    try {
      if (Object.keys(this._engram.fields).length == 0)
        await this.getEncoding();

      // update the source
      //
      let results = 0;

      // return status of source insertion
      return new StorageResults( (results > 0) ? "ok" : "not stored", null, null, results);
    }
    catch(err) {
      //* translate source errors as needed
      this._logger.error(err.message);
      throw err;
    }
  }

  /**
   * @param {*} pattern Should contain a meta key used to identify the construct.
   */
  async recall(pattern) {
    this._logger.debug("ScraperJunction recall");

    if (this._engram.keyof === 'uid' || this._engram.keyof === 'key')
      throw new StorageError({ statusCode: 400 }, "unique keys not supported");

    try {
      if (Object.keys(this._engram.fields).length == 0)
        await this.getEncoding();

      // create query
      // update source
      //
      let results = 0;

      return new StorageResults( (results > 0) ? "ok" : "not found", rows[0]);
    }
    catch(err) {
      //* translate source errors as needed
      this._logger.error(err.message);
      throw err;
    }
  }

  /**
   * @param {*} pattern can contain match, fields, .etc used to select constructs
   */
  async retrieve(pattern) {
    this._logger.debug("ScraperJunction retrieve");

    try {
      if (Object.keys(this._engram.fields).length == 0)
        await this.getEncoding();

      //* create query
      //*
      let results = 0;

      return new StorageResults((results > 0) ? "retreived" : "not found", rows);
    }
    catch(err) {
      //* translate source errors as needed
      this._logger.error(err.message);
      throw err;
    }
  }

  /**
   * pattern can contain a meta key OR a match
   */
  async dull(pattern) {
    this._logger.debug("ScraperJunction dull");

    if (this._engram.keyof === 'uid' || this._engram.keyof === 'key')
      throw new StorageError({ statusCode: 400 }, "unique keys not supported");

    try {
      if (Object.keys(this._engram.fields).length == 0)
        await this.getEncoding();

      let results = null;
      if (this._engram.keyof === 'list' || this._engram.keyof === 'all') {
        // delete construct by ID
        //* create query
        //* update source
        results = 0;
      }
      else {
        // delete all constructs in the .schema
        //* create query
        //* update source
        results = 0;
      }

      return new StorageResults((results.count > 0) ? "ok" : "not found", null, null, results);
    }
    catch (err) {
      //* translate source errors as needed
      this._logger.error(err.message);
      throw err;
    }
  }

};
