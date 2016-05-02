'use strict';

var authorize = require('../middleware/authorization');
var users = require('../controllers/users');
var link = require('../middleware/link');

module.exports = function(router) {
  router.get('/users/:uuid/profile', authorize.requiresAPILogin, link.trackProfileView, users.profile);
  router.get('/users/:uuid/profile/avatar', users.load, users.getProfileAvatar);
  router.get('/users/:uuid', authorize.requiresAPILogin, users.profile);
};
