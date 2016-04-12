'use strict';

var express = require('express');

module.exports = function(dependencies) {
  var router = express.Router();

  var config = dependencies('config')('default');
  var logger = dependencies('logger');

  if (config.auth && config.auth.oauth && config.auth.oauth.strategies && config.auth.oauth.strategies.length) {
    config.auth.oauth.strategies.forEach(function(strategy) {
      try {
        require('./strategies/' + strategy)(router, dependencies);
      } catch (err) {
        logger.warn('Can not initialize %s router oauth login strategy', strategy, err);
      }
    });
  }

  return router;
};
