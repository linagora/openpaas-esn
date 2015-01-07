'use strict';

var path = require('path');
var express = require('express');
var lessMiddleware = require('less-middleware');
var FRONTEND_PATH = path.join(__dirname, '../../frontend');
var CSS_PATH = FRONTEND_PATH + '/css';
var VIEW_PATH = FRONTEND_PATH + '/views';

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

module.exports = function(appManager, dependencies) {

  var app = express();
  app.use(express.static(FRONTEND_PATH));
  app.set('views', VIEW_PATH);
  app.use(lessMiddleware(
    FRONTEND_PATH,
    process.env.NODE_ENV === 'production' ? lessMiddlewareConfig.production.options : lessMiddlewareConfig.dev.options));
  app.use(express.static(CSS_PATH));

  function views(req, res) {
    var templateName = req.params[0].replace(/\.html$/, '');
    return res.render(templateName);
  }
  app.get('/views/*', views);

  var appstore = require('./routes/appstore')(appManager, dependencies);
  app.use('/', appstore);

  return app;
};
