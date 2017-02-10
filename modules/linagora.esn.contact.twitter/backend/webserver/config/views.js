'use strict';

const express = require('express');
const FRONTEND_PATH = require('../constants').FRONTEND_PATH;

module.exports = function(dependencies, application) { // eslint-disable-line
  application.use(express.static(FRONTEND_PATH));
  application.set('views', FRONTEND_PATH + '/views');
  application.get('/views/*', function(req, res) {
    const templateName = req.params[0].replace(/\.html$/, '');

    res.render(templateName);
  });
};
