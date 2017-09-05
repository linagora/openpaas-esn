'use strict';

const express = require('express');
const FRONTEND_PATH = require('./constants').FRONTEND_PATH;

module.exports = (lib, dependencies) => {
  const application = express();

  // This needs to be initialized before the body parser
  require('./config/i18n')(dependencies, application);
  application.use(express.static(FRONTEND_PATH));
  require('./config/views')(dependencies, application);

  application.use(require('./api/routes')(lib, dependencies));
  application.use(require('./api/kue')(lib, dependencies));

  return application;
};
