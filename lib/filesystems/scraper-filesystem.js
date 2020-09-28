"use strict";

const { FileSystem, StorageError } = require("@dictadata/storage-junctions");
const logger = require("../logger");

const { chromium } = require('playwright');
const Axios = require("axios");
const zlib = require('zlib');
const path = require('path');
var HTMLParser = require('node-html-parser');


module.exports = exports = class ScraperFileSystem extends FileSystem {

  /**
   *
   * @param {*} SMT  example "model|url|filename|*"
   * @param {*} options  Puppeteer options: useragent, 
   */
  constructor(SMT, options) {
    super(SMT, options);
    logger.debug("ScraperFileSystem");

    this.fsType = this.options.fsType || 'http';
    this._fstlen = this.fsType.length + 1;  // http:

    let url = new URL(this.smt.schema, this.smt.locus);
    if (!this.options.origin)
      this.options.origin = url.origin;
    if (!this.options.dirname)
      this.options.dirname = path.dirname(url.pathname);
    if (!this.options.dirname.endsWith('/'))
      this.options.dirname += '/';

    this.response = {};
  }

  async activate() {
    try {
      this.browser = await chromium.launch({ headless: false });
      this.page = await this.browser.newPage({ acceptDownloads: true });
    }
    catch (err) {
      logger.error(err.message);
    }

    this.isActive = true;
  }

  async relax() {
    this.isActive = false;
    try {
      await this.browser.close();
    }
    catch (err) {
      logger.error(err.message);
    }

  }

  /**
   *
   * @param {*} options
   */
  async list(options) {
    options = Object.assign({}, this.options, options);
    let schema = options.schema || this.smt.schema;
    let dirname = options.dirname || "/";
    let list = [];

    // regex for filespec match
    let filespec = schema || '*';
    let rx = '^' + filespec + '$';
    rx = rx.replace('.', '\\.');
    rx = rx.replace('*', '.*');
    rx = new RegExp(rx);

    try {
      let that = this;

      // recursive scanner function
      // eslint-disable-next-line no-inner-declarations
      async function scanner(path) {
        logger.debug('scanner');

        // HTTP GET
        options.method = 'GET';
        options.path = path;
        let content = await that.getHttpPage(options);
        logger.debug(content);

        if (!that.response._headers['content-type'].startsWith('text/html'))
          throw new Error('invalid content-type');

        // parse the html page into a simple DOM
        var root = HTMLParser.parse(content, {
          lowerCaseTagName: true,  // convert tag name to lower case (hurt performance heavily)
          script: true,             // retrieve content in <script> (hurt performance slightly)
          style: false,             // retrieve content in <style> (hurt performance slightly)
          pre: true,                // retrieve content in <pre> (hurt performance slightly)
          comment: false            // retrieve comments (hurt performance slightly)
        });

        // parse html directory
        var pre = root.querySelectorAll('pre');
        var directory = that.parseHtmlDir(pre[0].rawText);
        logger.debug(JSON.stringify(directory, null, 2));

        for (let entry of directory) {
          if (entry.isDir && that.options.recursive) {
            let subpath = path + entry.path;
            if (entry.path.startsWith('/'))
              subpath = entry.path;
            await scanner(subpath);
          }
          else if (!entry.isDir && rx.test(entry.name)) {
            logger.debug(JSON.stringify(entry, null, 2));

            entry.filepath = path + entry.name;
            if (entry.filepath.startsWith(that.options.dirname))
              entry.filepath = entry.filepath.substring(that.options.dirname.length);

            if (that.options.forEach)
              await that.options.forEach(entry);

            list.push(entry);
          }
        }
      }

      await scanner(dirname);
    }
    catch (err) {
      logger.error(err);
      throw err;
    }

    return list;
  }

  /**
  * createReadStream
  */
  async createReadStream(options) {
    logger.debug("ScraperFileSystem createReadStream");
    options = Object.assign({}, this.options, options);
    let schema = options.schema || this.smt.schema;
    let rs = null;

    try {
      // create read stream
      options.path = options.dirname + schema;
      options.saveFiles = false;
      rs = await this.getHttpFile(options);

      ///// check for zip
      if (schema.endsWith('.gz')) {
        var gzip = zlib.createGunzip();
        rs.pipe(gzip);
        return gzip;
      }
    }
    catch (err) {
      logger.error(err);
      throw err;
    }

    return rs;
  }

  /**
  * createWriteStream
  */
  async createWriteStream(options) {
    logger.debug("ScraperFileSystem createWriteStream");
    throw new StorageError({ statusCode: 501 }, "ScraperFileSystem.createWriteStream method not implemented");

    // implement writestream creation in overrides
    //options = Object.assign({}, this.options, options);
    //let schema = options.schema || this.smt.schema;
    //let ws = false;

    //this.isNewFile = true | false

    //return ws;
  }

  async download(options) {
    logger.debug("ScraperFileSystem createReadStream");
    options = Object.assign({}, this.options, options);
    let schema = options.schema || this.smt.schema;
    let result = false;

    try {
      // get file
      options.path = options.dirname + schema;
      options.saveFiles = true;
      result = await this.getHttpFile(options);
    }
    catch (err) {
      logger.error(err);
      throw err;
    }

    return result;
  }

  /////// HTTP requests

  async getHttpPage(options) {
    let url = options.origin + options.path;

    this.response = await this.page.goto(url);
    const html = await this.page.$eval('body', e => e.outerHTML);

    logger.debug(html);
    return html;
  }

  async getHttpFile(options) {
    let url = options.origin + options.path;
    let rs = null;

    try {
      const [download] = await Promise.all([
        this.page.waitForEvent('download'), // wait for download to start
        this.page.click('a[href="' + options.path + '"]', { button: "left" })
      ]);

      // wait for download to complete
      const downloadPath = await download.path();
      logger.verbose(downloadPath);
      const filename = await download.suggestedFilename();
      logger.verbose(filename);

      if (options.saveFiles) {
        await download.saveAs(options.saveFolder + filename);
        rs = true;
      }
      else {
        rs = await download.createReadStream();
        if (rs === null)
          throw new Error(download.failure());
      }
    }
    catch (err) {
      logger.error(err.message);
    }

    return rs;
  }

  /////// parse HTML directory page

  parseHtmlDir(dirText) {
    let server = this.response._headers["server"];

    let direxp = null;
    if (this.options.direxp)
      direxp = this.options.direxp;
    if (server.indexOf("IIS") >= 0)
      direxp = /(?<date>.*AM |.*PM ) +(?<size>[0-9]+|<dir>) <a href="(?<href>.*)">(?<name>.*)<\/a>/;
    else if (server.indexOf("nginx") >= 0)
      direxp = /<a href="(?<href>.*)">(?<name>.*)<\/a> +(?<date>[0-z,\-]+ [0-9,:]+) +(?<size>.*)/;

    dirText = decodeURI(dirText);
    var lines = dirText.split(/(?:<br>|\n|\r)+/);
    var entries = [];

    for (var i = 0; i < lines.length; i++) {
      var line = this.decodeEntities(lines[i]);

      var m = direxp.exec(line);
      if (m && m.length === 5) {
        let d = m.groups;
        var isDir = Number.isNaN(Number.parseInt(d['size']));

        var direntry = {
          href: d['href'],
          name: d['name'],
          isDir: isDir,
          date: new Date(d['date']),
          size: isDir ? 0 : parseInt(d['size'])
        };

        entries.push(direntry);
      }
    }

    return entries;
  }

  decodeEntities(encodedString) {
    var translate_re = /&(nbsp|amp|quot|lt|gt);/g;
    var translate = {
      "nbsp": " ",
      "amp": "&",
      "quot": "\"",
      "lt": "<",
      "gt": ">"
    };

    return encodedString.replace(translate_re, function (match, entity) {
      return translate[entity];
    }).replace(/&#(\d+);/gi, function (match, numStr) {
      var num = parseInt(numStr, 10);
      return String.fromCharCode(num);
    });
  }

};
