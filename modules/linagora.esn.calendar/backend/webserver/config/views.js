'use strict';

var express = require('express');
var FRONTEND_PATH = require('../constants').FRONTEND_PATH;

module.exports = function(dependencies, application) {
  application.use(express.static(FRONTEND_PATH));
};
