'use strict';

const expressSession = require('express-session');
const MongoStore = require('@linagora/awesome-sessionstore')(expressSession);
const mongoose = require('mongoose');
const core = require('../../core');

const mongo = core.db.mongo;
const mongotopic = core.pubsub.local.topic('mongodb:connectionAvailable');
const mongosessiontopic = core.pubsub.local.topic('webserver:mongosessionstoreEnabled');
const logger = core.logger;
const DEFAULT_SESSION_SECRET = 'this is the secret!';

module.exports = init;

function init(session) {
  const store = new MongoStore({ mongoose });

  if (mongo.isConnected()) {
    setSession();
  }

  mongotopic.subscribe(setSession);

  function setSession() {
    logger.debug('mongo is connected, setting up mongo session store');

    getSessionSecret().then(secret => {
      session.setMiddleware(expressSession({
        resave: true, // our session store does not support 'touch', so we must tell express to resave session if modified during the request
        saveUninitialized: false,
        cookie: { maxAge: 6000000 },
        secret,
        store
      }));
      mongosessiontopic.publish({});
    }, err => {
      logger.error('Failed to get session secret configuration', err);
    });
  }
}

function getSessionSecret() {
  return core['esn-config']('session').get().then(data =>
    (data && data.secret ? data.secret : DEFAULT_SESSION_SECRET)
  );
}
