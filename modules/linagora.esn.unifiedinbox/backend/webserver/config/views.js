'use strict';

const express = require('express'),
      constants = require('../constants');

const FRONTEND_PATH = constants.FRONTEND_PATH,
      CORE_FRONTEND_PATH = constants.CORE_FRONTEND_PATH;

module.exports = (dependencies, application) => {
  application.use(express.static(FRONTEND_PATH));
  application.set('views', [FRONTEND_PATH + '/views', FRONTEND_PATH + '/app']);

  application.get([
    '/views/*',
    '/app/*'
  ], (req, res) => res.render(req.params[0].replace(/\.html$/, ''), { basedir: CORE_FRONTEND_PATH + '/views' }));
};
