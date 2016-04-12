'use strict';

var express = require('express');
var FRONTEND_PATH = require('../constants').FRONTEND_PATH;

module.exports = function(dependencies, application) {
  application.use(express.static(FRONTEND_PATH));
  application.set('views', FRONTEND_PATH + '/views');
  application.get('/views/*', function(req, res) {
      var templateName = req.params[0].replace(/\.html$/, '');
      res.render(templateName);
    }
  );
};
