'use strict';

const EXPORTED_SYMBOLS = ['getLogger'];

/////

const Cu = Components.utils;

Cu.import('resource://gre/modules/Log.jsm');
Cu.import('resource://gre/modules/Preferences.jsm');

/////

function getLogger(module) {
  let logger = Log.repository.getLogger('OpTbAutoconf.' + module);

  logger.level = Log.Level.Numbers[Preferences.get('extensions.op.autoconf.log.level')];
  logger.addAppender(new Log.FileAppender(Preferences.get('extensions.op.autoconf.log.file'), new Log.BasicFormatter()));

  return logger;
}
