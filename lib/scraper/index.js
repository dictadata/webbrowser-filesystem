/**
 * redshift/junction
 */
"use strict";

const {
  StorageJunction, StorageResults, StorageError, Engram
} = require('@dictadata/storage-junctions');

const RedshiftReader = require("./reader");
const RedshiftWriter = require("./writer");
const encoder = require("./encoder");
const sqlQuery = require("./sql_query");

const odbc = require('odbc');


module.exports = class RedshiftJunction extends StorageJunction {

  /**
   *
   * @param {*} SMT 'redshift|host=address;user=name;password=xyz;database=dbname;...|table|key' or an Engram object
   * @param {*} options
   */
  constructor(SMT, options = null) {
    super(SMT, options);
    this._logger.debug("RedshiftJunction");

    this._readerClass = RedshiftReader;
    this._writerClass = RedshiftWriter;

    this.poolConfig = {
      connectionString: this._engram.smt.locus,
      connectionTimeout: this._options.connectionTimeout || 10,
      loginTimeout: this._options.logintTimeout || 10,
      initialSize: 4,
      incrementSize: 2
    };

    this.pool = null;
  }

  async connect() {
    if (!this.pool)
      this.pool = await odbc.pool(this.poolConfig);
    return this.pool.connect();
  }

  async query(sql) {
    if (!this.pool)
      this.pool = await odbc.pool(this.poolConfig);
    return this.pool.query(sql);
  }

  async relax() {
    this._logger.debug("RedshiftJunction relax");

    // release an resources
    if (this.pool)
      await this.pool.close();
  }

  /**
   *  Get the encoding for the storage node.
   *  Possibly make a call to the source to acquire the encoding definitions.
   */
  async getEncoding() {
    this._logger.debug("RedshiftJunction getEncoding");

    try {
      // fetch encoding form storage source
      let conn = await this.connect();

      const columns = await conn.columns(null, null, this._engram.smt.schema, null);
      this._logger.debug(JSON.stringify(columns, replacer, "  "));

      for (let i = 0; i < columns.length; i++) {
        let field = encoder.storageField(columns[i]);
        this._engram.add(field);
      }

      conn.close();
      return this._engram;
    }
    catch (err) {
      if (err.errno === 1146)  // ER_NO_SUCH_TABLE
        return 'not found';

      this._logger.error(err.odbcErrors ? err.odbcErrors[0].message : err.message);
      throw err;
    }
  }

  /**
   * Sets the encoding for the storage node.
   * Possibly sending the encoding definitions to the source.
   * @param {*} encoding
   */
  async putEncoding(encoding) {
    this._logger.debug("RedshiftJunction putEncoding");

    try {
      // check if table already exists
      let conn = await this.connect();

      const tables = await conn.tables(null, null, this._engram.smt.schema, null);
      this._logger.debug(JSON.stringify(tables, replacer, "  "));

      if (tables.length > 0) {
        return 'schema exists';
      }

      let engram = new Engram(this._engram);
      engram.replace(encoding);

      // create table
      let sql = sqlQuery.sqlCreateTable(engram);
      let results = await conn.query(sql);

      conn.close();
      this._engram.replace(encoding);
      return this._engram;
    }
    catch(err) {
      this._logger.error(err.odbcErrors ? err.odbcErrors[0].message : err.message);
      throw err;
    }
  }

  /**
   *
   * @param {*} construct
   */
  async store(construct, options = null) {
    this._logger.debug("RedshiftJunction store");

    if (this._engram.keyof === 'uid' || this._engram.keyof === 'key')
      throw new StorageError({ statusCode: 400 }, "unique keys not supported");
    if (typeof construct !== "object")
      throw new StorageError({statusCode: 400}, "Invalid parameter: construct is not an object");

    try {
      if (Object.keys(this._engram.fields).length == 0)
        await this.getEncoding();

      let sql = sqlQuery.sqlInsert(this._engram, construct);
      let results = await this.query(sql);

      // check if row was inserted
      return new StorageResults( (results.count > 0) ? "ok" : "not stored", null, null, results);
    }
    catch(err) {
      if (err.errno === 1062) {  // ER_DUP_ENTRY
        return new StorageResults('duplicate', null, null, err);
      }

      this._logger.error(err.odbcErrors ? err.odbcErrors[0].message : err.message);
      throw err;
    }
  }

  /**
   *
   */
  async recall(options = null) {
    this._logger.debug("RedshiftJunction recall");

    if (this._engram.keyof === 'uid' || this._engram.keyof === 'key')
      throw new StorageError({ statusCode: 400 }, "unique keys not supported");

    try {
      if (Object.keys(this._engram.fields).length == 0)
        await this.getEncoding();

      let sql = "SELECT * FROM " + this._engram.smt.schema + sqlQuery.sqlWhereFromKey(this._engram, options);
      let rows = await this.query(sql);

      return new StorageResults( (rows.length > 0) ? "ok" : "not found", rows[0]);
    }
    catch(err) {
      this._logger.error(err.odbcErrors ? err.odbcErrors[0].message : err.message);
      throw err;
    }
  }

  /**
   *
   * @param {*} options options.pattern
   */
  async retrieve(options = null) {
    this._logger.debug("RedshiftJunction retrieve");
    let pattern = options && (options.pattern || options || {});

    try {
      if (Object.keys(this._engram.fields).length == 0)
        await this.getEncoding();

      let sql = sqlQuery.sqlSelectWithPattern(this._engram, pattern);
      let rows = await this.query(sql);

      return new StorageResults((rows.length > 0) ? "retreived" : "not found", rows);
    }
    catch(err) {
      this._logger.error(err.odbcErrors ? err.odbcErrors[0].message : err.message);
      throw err;
    }
  }

  /**
   *
   */
  async dull(options = null) {
    this._logger.debug("RedshiftJunction dull");
    if (!options) options = {};

    if (this._engram.keyof === 'uid' || this._engram.keyof === 'key')
      throw new StorageError({ statusCode: 400 }, "unique keys not supported");

    try {
      if (Object.keys(this._engram.fields).length == 0)
        await this.getEncoding();

      let results = null;
      if (this._engram.keyof === 'list' || this._engram.keyof === 'all') {
        // delete construct by ID
        let sql = "DELETE FROM " + this._engram.smt.schema + sqlQuery.sqlWhereFromKey(this._engram, options);
        results = await this.query(sql);
      }
      else {
        // delete all constructs in the .schema
        let sql = "TRUNCATE " + this._engram.smt.schema + ";";
        results = await this.query(sql);
      }

      return new StorageResults((results.count > 0) ? "ok" : "not found", null, null, results);
    }
    catch (err) {
      this._logger.error(err.odbcErrors ? err.odbcErrors[0].message : err.message);
      throw err;
    }
  }

};

function replacer(key, value) {
  // Filtering out properties
  // eslint-disable-next-line valid-typeof
  if (typeof value === "bigint") {
    return Number(value);
  }

  return value;
}
