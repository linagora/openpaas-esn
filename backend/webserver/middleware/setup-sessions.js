'use strict';

const expressSession = require('express-session');
const MongoStore = require('connect-mongo')(expressSession);
const mongoose = require('mongoose');
const core = require('../../core');
const esnConfig = require('../../core/esn-config');

const mongo = core.db.mongo;
const mongotopic = core.pubsub.local.topic('mongodb:connectionAvailable');
const mongosessiontopic = core.pubsub.local.topic('webserver:mongosessionstoreEnabled');
const logger = core.logger;
const DEFAULT_SESSION_SECRET = 'this is the secret!';

let initialized = false;
let store;

module.exports = init;

function init(session) {
  if (!initialized) {
    store = new MongoStore({ mongooseConnection: mongoose.connection });
    initialized = true;
  }

  if (mongo.isConnected()) {
    setSession();
  }

  esnConfig('session').onChange(setSession);

  mongotopic.subscribe(setSession);

  function setSession() {
    logger.debug('mongo is connected, setting up mongo session store');

    core['esn-config']('session').get().then(sessionConfig => {
      session.setMiddleware(expressSession({
        resave: true, // our session store does not support 'touch', so we must tell express to resave session if modified during the request
        saveUninitialized: false,
        cookie: { maxAge: 6000000 },
        secret: DEFAULT_SESSION_SECRET,
        store,
        ...sessionConfig
      }));
      mongosessiontopic.publish({});
    }, err => {
      logger.error('Failed to get session secret configuration', err);
    });
  }
}
