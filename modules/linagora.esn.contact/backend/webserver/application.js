'use strict';

const cors = require('cors');
var express = require('express');
var FRONTEND_PATH = require('./constants').FRONTEND_PATH;

module.exports = function(dependencies) {
  var application = express();

  // This needs to be initialized before the body parser
  require('./config/i18n')(dependencies, application);
  application.use(express.static(FRONTEND_PATH));
  require('./config/views')(dependencies, application);

  application.all('/api/*', cors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,REPORT,PROPFIND,PROPPATCH,MOVE'
  }));

  application.use('/api/contacts', require('./api/contacts')(dependencies));
  application.use('/api/addressbooks', require('./api/addressbooks/domain-members')(dependencies));

  return application;
};
