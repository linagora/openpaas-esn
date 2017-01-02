'use strict';

const express = require('express');

module.exports = function(dependencies, lib) {

  const router = express.Router();

  require('./user-status')(dependencies, lib, router);

  return router;
};
