'use strict';

var path = require('path');
var express = require('express');

module.exports = function(appManager, dependencies) {

  var app = express();
  app.use(express.static(path.join(__dirname, '../../frontend')));
  app.set('views', path.join(__dirname, '../../frontend/views'));

  function views(req, res) {
    var templateName = req.params[0].replace(/\.html$/, '');
    return res.render(templateName);
  }
  app.get('/views/*', views);

  var appstore = require('./routes/appstore')(appManager, dependencies);
  app.use('/', appstore);

  return app;
};
