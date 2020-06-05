'use strict';

const express = require('express');
const { FRONTEND_PATH, FRONTEND_PATH_BUILD, CORE_FRONTEND_PATH } = require('../constants');

module.exports = function(dependencies, application) {
  application.use(express.static(process.env.NODE_ENV !== 'production' ? FRONTEND_PATH : FRONTEND_PATH_BUILD));
  application.set('views', FRONTEND_PATH + '/app');
  application.get('/app/*', function(req, res) {
    const templateName = req.params[0].replace(/\.html$/, '');

    res.render(templateName, { basedir: CORE_FRONTEND_PATH + '/views' });
  });
};
