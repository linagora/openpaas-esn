'use strict';

const express = require('express');
const FRONTEND_PATH = require('../constants').FRONTEND_PATH;
const CORE_FRONTEND_PATH = require('../constants').CORE_FRONTEND_PATH;

module.exports = function(dependencies, application) {
  application.use(express.static(FRONTEND_PATH));
  application.set('views', FRONTEND_PATH + '/app');
  application.get('/app/*', function(req, res) {
    const templateName = req.params[0].replace(/\.html$/, '');

    res.render(templateName, { basedir: CORE_FRONTEND_PATH + '/views' });
  });
};
