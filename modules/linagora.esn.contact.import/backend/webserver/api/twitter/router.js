'use strict';

module.exports = function(router, dependencies) {

  var authorizationMW = dependencies('authorizationMW');
  var twitterImporter = require('./controller')(dependencies);
  var tokenMiddleware = dependencies('tokenMW');

  router.post('/twitter', authorizationMW.requiresAPILogin, tokenMiddleware.generateNewToken(), twitterImporter.importTwitterFollowing);
};
