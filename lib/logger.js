/**
 * logger.js
 */
"use strict";

const winston = require('winston');
const { transports, format } = winston;

const _level = process.env.LOG_LEVEL || 'verbose';

winston.configure({
  level: _level,
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true })
  ),
  transports: [
    // stdout
    new transports.Console({ format: format.cli() }),
    // stderr
    new transports.Console({ format: format.json(), level: 'error' })
  ]
});

module.exports = exports = winston;
