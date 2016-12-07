'use strict';

var express = require('express'),
    FRONTEND_PATH = require('../constants').FRONTEND_PATH;

module.exports = function(dependencies, application) {
  application
    .use(express.static(FRONTEND_PATH))
    .set('views', FRONTEND_PATH + '/app')
    .get('/app/*', (req, res) => res.render(req.params[0].replace(/\.html$/, '')));
};
