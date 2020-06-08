'use strict';

var express = require('express');
const { FRONTEND_PATH, FRONTEND_PATH_BUILD } = require('../constants');

module.exports = function(dependencies, application) {
  application.use(express.static(process.env.NODE_ENV !== 'production' ? FRONTEND_PATH : FRONTEND_PATH_BUILD));
  application.set('views', FRONTEND_PATH + '/views');
  application.get('/views/*', function(req, res) {
      var templateName = req.params[0].replace(/\.html$/, '');
      res.render(templateName);
    }
  );
};
