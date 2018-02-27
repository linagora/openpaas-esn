'use strict';

const express = require('express');
const { FRONTEND_PATH, CORE_FRONTEND_PATH } = require('../constants');

module.exports = (dependencies, application) => {
  application.use(express.static(FRONTEND_PATH));
  application.set('views', [FRONTEND_PATH + '/views', FRONTEND_PATH + '/app']);
  application.get([
    '/views/*',
    '/app/*'
  ], (req, res) => res.render(req.params[0].replace(/\.html$/, ''), { basedir: CORE_FRONTEND_PATH + '/views' }));
};
