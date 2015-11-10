'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var router = express.Router();

  require('./twitter')(router, dependencies);

  return router;
};
