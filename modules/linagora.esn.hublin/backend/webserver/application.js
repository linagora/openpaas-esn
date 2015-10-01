'use strict';

var path = require('path');
var express = require('express');
var FRONTEND_PATH = path.join(__dirname, '../../frontend');
var VIEW_PATH = FRONTEND_PATH + '/views';

module.exports = function(dependencies) {

  var app = express();
  app.use(express.static(FRONTEND_PATH));
  app.set('views', VIEW_PATH);

  function views(req, res) {
    var templateName = req.params[0].replace(/\.html$/, '');
    return res.render(templateName);
  }
  app.get('/views/*', views);

  return app;
};
