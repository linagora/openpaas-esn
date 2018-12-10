require('winston-daily-rotate-file');

const { createLogger, transports, format } = require('winston');
const Elasticsearch = require('winston-elasticsearch');
const CircularJSON = require('circular-json');

const config = require('../config')('default');

const { combine, colorize, splat, printf, timestamp, json, uncolorize, prettyPrint } = format;

const customFormat = printf(({ timestamp, level, message, meta }) => {
  const result = `${timestamp} ${level} ${message}`;

  if (meta instanceof Error) {
    return `${result}: ${meta.stack}`;
  }

  if (typeof meta === 'string') {
    return `${result}: ${meta}`;
  }

  if (Array.isArray(meta)) {
    return `${result}: ${meta.join(' ')}`;
  }

  if (meta instanceof Object && !Array.isArray(meta)) {
    return `${result}: ${CircularJSON.stringify(meta)}`;
  }

  return result;
});

const logger = createLogger({
  exitOnError: false,
  format: combine(
    splat(),
    timestamp()
  )
});

logger.stream = {
  write: function(message) {
    logger.info(message.replace(/\n$/, ''));
  }
};

if (config.log.console.enabled) {
  logger.add(new transports.Console({
    ...config.log.console,
    format: _buildFormat(config.log.console)
  }));
}

if (config.log.file.enabled) {
  logger.info('Logger: registering file logger');
  logger.add(new transports.File({
    ...config.log.file,
    format: _buildFormat(config.log.file)
  }));
}

if (config.log.rotate && config.log.rotate.enabled) {
  logger.info('Logger: registering rotate logger');
  logger.add(new transports.DailyRotateFile({
    ...config.log.rotate,
    format: _buildFormat(config.log.rotate)
  }));
}

if (config.log.elasticsearch && config.log.elasticsearch.enabled) {
  logger.info('Logger: registering Elasticsearch logger');
  logger.add(new Elasticsearch({
    ...config.log.elasticsearch,
    transformer
  }));
}

function transformer({ level, message, meta }) {
  const payload = {
    '@timestamp': meta.timestamp || new Date().toISOString(),
    severity: level,
    message,
    fields: JSON.parse(CircularJSON.stringify(meta))
  };

  if (meta.meta instanceof Error) {
    payload.stacktrace = meta.meta.stack || {};
  }

  const extraFields = config.log.elasticsearch.extraFields;

  if (extraFields) {
    Object.keys(extraFields).forEach(fieldName => {
      if (process.env[extraFields[fieldName]]) {
        payload[fieldName] = process.env[extraFields[fieldName]];
      }
    });
  }

  return payload;
}

function _buildFormat(config) {
  let formatFn;

  if (config.json) {
    formatFn = json;
  }

  if (config.prettyPrint) {
    formatFn = prettyPrint;
  }

  return combine(
    config.colorize ? colorize() : uncolorize(),
    formatFn ? formatFn() : customFormat
  );
}

module.exports = logger;
