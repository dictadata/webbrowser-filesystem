"use strict";

const { FileSystem, StorageError } = require("@dictadata/storage-junctions");
const logger = require("../logger");

const { chromium } = require('playwright');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
var HTMLParser = require('node-html-parser');
var Readable = require('stream').Readable;


module.exports = exports = class WebBrowserFileSystem extends FileSystem {

  /**
   *
   * @param {*} SMT  example "model|url|filename|*"
   * @param {*} options  Puppeteer options: useragent, 
   */
  constructor(SMT, options) {
    super(SMT, options);
    logger.debug("WebBrowserFileSystem");

    this.fsType = this.options.fsType || 'http';
    this._fstlen = this.fsType.length + 1;  // http:

    let url = new URL(this.smt.schema, this.smt.locus);
    if (!this.options.origin)
      this.options.origin = url.origin;
    if (!this.options.dirname)
      this.options.dirname = path.dirname(url.pathname);
    if (!this.options.dirname.endsWith('/'))
      this.options.dirname += '/';

    this._response = {};
    this._list = null;
  }

  async activate() {
    try {
      this.browser = await chromium.launch({ headless: false });
      this.page = await this.browser.newPage({ acceptDownloads: true });

      // list() must be called before downloading files
      // even if it does not return a file list.
      // list() will load the containing web page in the headless browser
      // as it will be used to "click" on hyperlinks in anchor tags or form actions.
      // The tag for each file's hyperlink must be identifiable with a
      // HTML DOM selector.
      await this.list();
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
    if (this._list && options && !options.reload)
      return this._list;

    options = Object.assign({}, this.options, options);
    let schema = options.schema || this.smt.schema;
    let dirname = options.dirname || "/";
    this._list = [];

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
      async function scanner(dirpath) {
        logger.debug('scanner');

        // HTTP GET
        options.method = 'GET';
        options.path = dirpath;
        let content = await that._getHttpPage(options);
        logger.debug(content);

        if (!that._response._headers['content-type'].startsWith('text/html'))
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
        var directory = that._parseHtmlDir(pre[0].rawText);
        logger.debug(JSON.stringify(directory, null, 2));

        for (let entry of directory) {
          if (entry.isDir && that.options.recursive) {
            let subpath = dirpath + entry.href;
            if (entry.href.startsWith('/'))
              subpath = entry.href;
            await scanner(subpath);
          }
          else if (!entry.isDir && rx.test(entry.name)) {
            logger.debug(JSON.stringify(entry, null, 2));

            entry.rpath = dirpath + entry.name;
            if (entry.rpath.startsWith(that.options.dirname))
              entry.rpath = entry.rpath.substring(that.options.dirname.length);

            if (that.options.forEach)
              await that.options.forEach(entry);
            that._list.push(entry);
          }
        }
      }

      await scanner(dirname);
    }
    catch (err) {
      logger.error(err);
      throw err;
    }

    return this._list;
  }

  /**
  * createReadStream
  */
  async createReadStream(options) {
    logger.debug("WebBrowserFileSystem createReadStream");
    options = Object.assign({}, this.options, options);
    let link = options.link || this.smt.schema;
    let rs = null;

    try {
      // create read stream
      options.path = options.dirname + link;
      options.saveFiles = false;

      let ext = path.extname(link);
      if (ext === '.json' || ext === '.xml')
        // browser displays file content
        rs = await this._getHttpContent(options);
      else
        // browser download
        rs = await this._getHttpFile(options);

      ///// check for zip
      if (link.endsWith('.gz')) {
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
    logger.debug("WebBrowserFileSystem createWriteStream");
    throw new StorageError({ statusCode: 501 }, "WebBrowserFileSystem.createWriteStream method not implemented");

    // implement writestream creation in overrides
    //options = Object.assign({}, this.options, options);
    //let link = options.link || this.smt.schema;
    //let ws = false;

    //this.isNewFile = true | false

    //return ws;
  }

  async download(options) {
    logger.debug("WebBrowserFileSystem createReadStream");
    options = Object.assign({}, this.options, options);
    const link = options.link || options.href || this.smt.schema;
    let result = false;

    try {
      // get file
      options.saveFiles = true;

      let ext = path.extname(link);
      if (ext === '.json' || ext === '.xml')
        // browser displays file content
        result = await this._getHttpContent(options);
      else
        // browser download
        result = await this._getHttpFile(options);
    }
    catch (err) {
      logger.error(err);
      throw err;
    }

    return result;
  }

  /////// HTTP requests

  async _getHttpPage(options) {
    let url = options.origin + options.path;

    this._response = await this.page.goto(url);
    const html = await this.page.$eval('body', e => e.outerHTML);

    logger.debug(html);
    return html;
  }

  async _getHttpContent(options) {
    let rs = null;
    const link = options.link || options.href || this.smt.schema;

    await this.page.click('a[href="' + encodeURI(link) + '"]', { button: "left" });
    let content = await this.page.content();
    if (content.startsWith('<html'))
      content = await this.page.$eval('body', e => e.innerText);
    await this.page.goBack();

    if (options.saveFiles) {
      try {
        if (options.savePaths)
          fs.mkdirSync(options.saveFolder + path.dirname(options.rpath));
      }
      catch (error) {
        if (error.code !== 'EEXIST')
          logger.error(error.messsage);
      }
      let filename = options.saveFolder + (options.savePaths ? options.rpath : options.name);
      fs.writeFileSync(filename, content);
      rs = true;
    }
    else {
      rs = new Readable();
      rs.push(content);
      rs.push(null);
    }

    return rs;
  }

  async _getHttpFile(options) {
    let rs = null;
    const link = options.link || options.href || this.smt.schema;

    try {
      const [download] = await Promise.all([
        this.page.waitForEvent('download'), // wait for download to start
        this.page.click('a[href="' + encodeURI(link) + '"]', { button: "left" })
      ]);

      // wait for download to complete
      const downloadPath = await download.path();
      logger.verbose(downloadPath);
      const name = await download.suggestedFilename();
      logger.verbose(name);

      if (options.saveFiles) {
        let filename = options.saveFolder + (options.savePaths ? options.rpath : name);
        await download.saveAs(filename);
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

  _parseHtmlDir(dirText) {
    let server = this._response._headers["server"];

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
      var line = this._decodeEntities(lines[i]);

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

  _decodeEntities(encodedString) {
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
