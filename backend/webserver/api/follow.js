'use strict';

var authorize = require('../middleware/authorization');
var followController = require('../controllers/follow');
var userMiddleware = require('../middleware/user');

module.exports = function(router) {

  router.get('/users/:id/followers', authorize.requiresAPILogin, followController.getFollowers);
  router.get('/users/:id/followings', authorize.requiresAPILogin, followController.getFollowings);
  router.get('/users/:id/followings/:tid', authorize.requiresAPILogin, followController.isFollowing);
  router.put('/users/:id/followings/:tid', authorize.requiresAPILogin, userMiddleware.loadFollowing, userMiddleware.canFollow, followController.follow);
  router.delete('/users/:id/followings/:tid', authorize.requiresAPILogin, userMiddleware.loadFollowing, userMiddleware.canUnfollow, followController.unfollow);

};
