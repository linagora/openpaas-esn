'use strict';

var express = require('express');
var path = require('path');
var FRONTEND_PATH = path.normalize(__dirname + '/../../frontend');
var CSS_PATH = FRONTEND_PATH + '/css';
var lessMiddleware = require('less-middleware');
var i18n = require('../i18n');

var lessMiddlewareConfig = {
  production: {
    options: {
      once: true
    }
  },
  dev: {
    options: {
      force: true,
      debug: true,
      compiler: {
        sourceMap: true
      }
    }
  }
};


function projectApplication(projectLib, dependencies) {
  var app = express();

  app.use(i18n.init);

  app.use('/css', lessMiddleware(
    CSS_PATH,
    process.env.NODE_ENV === 'production' ? lessMiddlewareConfig.production.options : lessMiddlewareConfig.dev.options));

  app.use(express.static(FRONTEND_PATH));
  app.set('views', FRONTEND_PATH + '/views');
  require('./routes')(app, projectLib, dependencies);
  return app;
}

module.exports = projectApplication;
