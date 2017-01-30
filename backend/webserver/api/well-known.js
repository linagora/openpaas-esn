'use strict';

const wellKnown = require('../../core/well-known');
const authorize = require('../middleware/authorization');

module.exports = function(router) {
  //TODO: reput authorize.requiresAPILogin
  router.get('/.well-known/openpaas', wellKnown.getServices);
};
