'use strict';

var authorize = require('../middleware/authorization');
var jwt = require('../controllers/authjwt');

module.exports = function(router) {
  router.post('/jwt/generate', authorize.requiresAPILogin, jwt.generateWebToken);
};
