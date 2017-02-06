'use strict';

module.exports = dependencies => {
  const application = require('express')();

  application.use(require('./autoconf')(dependencies));

  return application;
};
