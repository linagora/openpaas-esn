'use strict';

const wellKnown = require('../../core/well-known');
const authorize = require('../middleware/authorization.js');

module.exports = function(router) {
  router.get('/.well-known/openpaas', authorize.requiresAPILogin, wellKnown.getServices);
};
