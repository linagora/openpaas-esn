'use strict';

var authorize = require('../middleware/authorization');
var oauthclients = require('../controllers/oauthclients');

module.exports = function(router) {
  router.get('/oauth/clients', authorize.requiresAPILogin, oauthclients.list);
  router.post('/oauth/clients', authorize.requiresAPILogin, oauthclients.create);
  router.get('/oauth/clients/:id', authorize.requiresAPILogin, oauthclients.get);
  router.delete('/oauth/clients/:id', authorize.requiresAPILogin, oauthclients.remove);
};
