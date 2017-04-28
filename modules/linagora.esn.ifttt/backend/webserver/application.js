'use strict';

module.exports = dependencies => {
  const application = require('express')();

  application.use('/ifttt/v1', require('./ifttt/v1')(dependencies));

  return application;
};
