"use strict";

const { FileSystem, StorageError } = require("@dictadata/storage-junctions");
const logger = require("../logger");

const Nightmare = require('nightmare');
const Axios = require("axios");
const zlib = require('zlib');
const path = require('path');
var HTMLParser = require('node-html-parser');


module.exports = exports = class ScraperFileSystem extends FileSystem {

  /**
   *
   * @param {*} SMT  example "model|url|filename|*"
   * @param {*} options  Nightmare options: useragent, 
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
/*
    Nightmare.action(
      'clearCache',
      (name, options, parent, win, renderer, done) => {
        parent.respondTo('clearCache', done => {
          win.webContents.session.clearCache(done)
        })
        done()
      },
      function(done) {
        this.child.call('clearCache', done)
      }
    )
*/
    this.nightmare = Nightmare({ show: true })
    if (this.options.useragent)
      this.nightmare.useragent(this.options.useragent);
      
    this.isActive = true;
  }

  async relax() {
    this.isActive = false;
    await this.nightmare.end();
  }
  /**
   *
   * @param {*} options
   */
  async list(options) {
    options = Object.assign({}, this.options, options);
    let path = this.options.dirname || "/";
    let list = [];

    // regex for filespec match
    let filespec = options.schema || this.smt.schema || '*';
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
        that.options.method = 'GET';
        let content = await that.getHttp(path);
        //console.log(content);

        if (!that.response.headers['content-type'][0].startsWith('text/html'))
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
        //console.log(JSON.stringify(directory,null,2));

        for (let entry of directory) {
          if (entry.isDir && that.options.recursive) {
            let subpath = path + entry.path;
            if (entry.path.startsWith('/'))
              subpath = entry.path;
            await scanner(subpath);
          }
          else if (!entry.isDir && rx.test(entry.name)) {
            //console.log(JSON.stringify(entry,null,2));

            let filepath = path + entry.name;
            if (filepath.startsWith(that.options.dirname))
              filepath = filepath.substring(that.options.dirname.length);

            if (that.options.forEach)
              await that.options.forEach(filepath);
            
            list.push(filepath);
          }
        }
      }

      await scanner(path);
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
    let options = this.options || {};
    let rs = null;

    try {
      let filename = this.options.dirname + this.smt.schema;

       // create read stream
       rs = await this.getHttpFile(filename, {});
     
      ///// check for zip
      if (filename.endsWith('.gz')) {
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
    //let ws = false;

    //this.isNewFile = true | false

    //return ws;
  }

  /////// HTTP requests

  async getHttp(path, options) {
    let url = this.options.origin + path;

    this.response = await this.nightmare
    .goto(url);

    let html = await this.nightmare
    .wait('body')
    .evaluate(() => document.querySelector('body').innerHTML);

    console.log(html);
    return html;
  }

  async getHttpFile(path, options) {
    let url = this.options.origin + path;

    this.nightmare.on('will-download', (event, item, webContents) => {
      // Set the save path, making Electron not to prompt a save dialog.
      item.setSavePath('../output/save.bin');
    
      item.on('updated', (event, state) => {
        if (state === 'interrupted') {
          console.log('Download is interrupted but can be resumed')
        } else if (state === 'progressing') {
          if (item.isPaused()) {
            console.log('Download is paused')
          } else {
            console.log(`Received bytes: ${item.getReceivedBytes()}`)
          }
        }
      });

      item.once('done', (event, state) => {
        if (state === 'completed') {
          console.log('Download successfully')
        } else {
          console.log(`Download failed: ${state}`)
        }
      });
    })    

    this.response = await this.nightmare
    .goto(url);

    return true;
  }

  /////// parse HTML directory page

  parseHtmlDir(dirText) {
    let server = this.response.headers["server"][0];

    let direxp = null;
    if (this.options.direxp)
      direxp = this.options.direxp;
    if (server.indexOf("IIS") >= 0)
      direxp = /(?<date>.*AM|PM) +(?<size>[0-9]+|<dir>) <a href="(?<path>.*)">(?<name>.*)<\/a>/;
    else if (server.indexOf("nginx") >= 0)
      direxp = /<a href="(?<path>.*)">(?<name>.*)<\/a> +(?<date>[0-z,\-]+ [0-9,:]+) +(?<size>.*)/;

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
          path: d['path'],
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
