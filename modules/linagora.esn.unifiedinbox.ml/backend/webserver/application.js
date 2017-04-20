'use strict';

module.exports = dependencies => {
  const application = require('express')();

  require('./config/i18n')(dependencies, application);
  require('./config/views')(dependencies, application);

  return application;
};
