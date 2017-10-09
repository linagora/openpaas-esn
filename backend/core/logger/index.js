'use strict';

var config = require('../config')('default');
var Winston = require('winston');

require('./winston-logrotate');

var logger = new (Winston.Logger)({
  exitOnError: false
});

logger.stream = {
  write: function(message) {
    logger.info(message.replace(/\n$/, ''));
  }
};

if (config.log.console.enabled) {
  logger.add(Winston.transports.Console, config.log.console);
}
if (config.log.file.enabled) {
  logger.info('Logger: registering file logger');
  logger.add(Winston.transports.File, config.log.file);
}
if (config.log.rotate && config.log.rotate.enabled) {
  logger.info('Logger: registering rotate logger');
  logger.add(Winston.transports.Rotate, config.log.rotate);
}

module.exports = logger;
