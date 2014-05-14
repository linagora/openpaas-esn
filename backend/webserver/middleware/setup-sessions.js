'use strict';

var expressSession = require('express-session'),
    MongoStore = require('connect-mongo')(expressSession),
    mongoose = require('mongoose'),
    core = require('../../core'),
    mongo = core.db.mongo,
    topic = core.pubsub.local.topic('mongodb:connectionAvailable'),
    logger = core.logger;

function setupSession(session) {
  var setSession = function() {
    logger.debug('mongo is connected, setting up mongo session store');
    session.setMiddleware(expressSession({
      cookie: { maxAge: 6000000 },
      store: new MongoStore({
        auto_reconnect: true,
        mongoose_connection: mongoose.connections[0]
      })
    }));
  };
  if (mongo.isConnected()) {
    setSession();
  }
  topic.subscribe(setSession);
}

module.exports = setupSession;
