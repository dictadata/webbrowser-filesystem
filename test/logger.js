/**
 * logger.js
 */
"use strict";

const winston = require('winston');

const _level = process.env.LOG_LEVEL || 'verbose';

winston.configure({
  level: _level,
  transports: [
  ]
});

if (process.env.NODE_ENV !== 'xproduction') {
  winston.add(new winston.transports.Console({ format: winston.format.cli() }));
  winston.add(new winston.transports.Console({ format: winston.format.errors({ stack: true }), level: 'error' }));
}

module.exports = winston;
