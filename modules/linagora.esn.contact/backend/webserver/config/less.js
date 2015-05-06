'use strict';

var lessMiddleware = require('less-middleware');
var FRONTEND_PATH = require('../constants').FRONTEND_PATH;
var express = require('express');

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

module.exports = function(dependencies, application) {
  application.use('/css', lessMiddleware(
    FRONTEND_PATH + '/css',
    process.env.NODE_ENV === 'production' ?
      lessMiddlewareConfig.production.options :
      lessMiddlewareConfig.dev.options));
  application.use(express.static(FRONTEND_PATH + '/css'));
};
