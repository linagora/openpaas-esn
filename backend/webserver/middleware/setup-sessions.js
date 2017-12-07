'use strict';

const expressSession = require('express-session');
const MongoStore = require('@linagora/awesome-sessionstore')(expressSession);
const mongoose = require('mongoose');
const core = require('../../core');

const mongo = core.db.mongo;
const mongotopic = core.pubsub.local.topic('mongodb:connectionAvailable');
const mongosessiontopic = core.pubsub.local.topic('webserver:mongosessionstoreEnabled');
const logger = core.logger;

module.exports = init;

function init(session) {
  const store = new MongoStore({ mongoose });

  if (mongo.isConnected()) {
    setSession();
  }

  mongotopic.subscribe(setSession);

  function setSession() {
    logger.debug('mongo is connected, setting up mongo session store');

    session.setMiddleware(expressSession({
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 6000000 },
      secret: 'this is the secret!',
      store
    }));
    mongosessiontopic.publish({});
  }
}
