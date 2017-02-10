'use strict';

var path = require('path');
var express = require('express');
var i18n = require('i18n');
var FRONTEND_PATH = path.join(__dirname, '../../frontend');
var VIEW_PATH = FRONTEND_PATH + '/views';

module.exports = function(appManager, dependencies) {

  var app = express();
  app.use(i18n.init);
  app.use(express.static(FRONTEND_PATH));
  app.set('views', VIEW_PATH);

  function views(req, res) {
    var templateName = req.params[0].replace(/\.html$/, '');
    return res.render(templateName);
  }
  app.get('/views/*', views);

  var appstore = require('./routes/appstore')(appManager, dependencies);
  app.use('/', appstore);

  return app;
};
