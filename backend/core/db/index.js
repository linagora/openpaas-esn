var logger = require('../../core').logger;


var dbModule = {
  mongo: require('./mongo')
};

// try to initialize Mongo
if (!dbModule.mongo.init()) {
  logger.warn('The MongoDB datastore could not be initialized');
}

module.exports = dbModule;
