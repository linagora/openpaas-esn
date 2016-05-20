'use strict';

var authorize = require('../middleware/authorization');
var authentication = require('../controllers/authtoken');
var authTokenMiddleware = require('../middleware/token');

module.exports = function(router) {
  router.get('/authenticationtoken', authorize.requiresAPILogin, authentication.getNewToken);
  router.get('/authenticationtoken/:token', authorize.requiresAPILogin, authTokenMiddleware.getToken, authentication.getToken);
  router.get('/authenticationtoken/:token/user', authTokenMiddleware.getToken, authentication.authenticateByToken);
};
