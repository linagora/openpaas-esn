'use strict';

const express = require('express');
const FRONTEND_PATH = require('../constants').FRONTEND_PATH;

module.exports = (dependencies, application) => {
  application.use(express.static(FRONTEND_PATH));
  application.set('views', FRONTEND_PATH + '/views');
  application.get('/views/*', (req, res) => res.render(req.params[0].replace(/\.html$/, '')));
};
