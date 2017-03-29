'use strict';

const express = require('express');

module.exports = dependencies => {
  const application = express();

  // This needs to be initialized before the body parser
  require('./config/i18n')(dependencies, application);
  require('./config/views')(dependencies, application);

  return application;
};
