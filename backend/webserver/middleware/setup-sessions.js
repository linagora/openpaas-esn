'use strict';

var express = require('express'),
    MongoStore = require('connect-mongo')(express),
    mongoose = require('mongoose');

function setupSession(session) {
  var setSession = function() {
    session.setMiddleware(express.session({
      store: new MongoStore({
        auto_reconnect: true,
        mongoose_connection: mongoose.connections[0]
      })
    }));
  };
  mongoose.connection.once('connected', setSession);
}

module.exports = setupSession;
