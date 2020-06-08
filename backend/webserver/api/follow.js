'use strict';

var authorize = require('../middleware/authorization');
var followController = require('../controllers/follow');
var userMiddleware = require('../middleware/user');

module.exports = function(router) {

  router.head('/users/:id/followers', authorize.requiresAPILogin, followController.getFollowersHeaders);

  /**
   * @swagger
   * /api/users/{id}/followers:
   *   get:
   *     tags:
   *      - Users
   *      - Follow
   *     description:
   *       Get the followers of the given user.
   *     parameters:
   *       - $ref: "#/parameters/fl_id"
   *       - $ref: "#/parameters/fl_limit"
   *       - $ref: "#/parameters/fl_offset"
   *     responses:
   *       200:
   *         $ref: "#/responses/fl_user"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/users/:id/followers', authorize.requiresAPILogin, followController.getFollowers);

  router.head('/users/:id/followings', authorize.requiresAPILogin, followController.getFollowingsHeaders);

  /**
   * @swagger
   * /api/users/{id}/followings:
   *   get:
   *     tags:
   *      - Users
   *      - Follow
   *     description:
   *       Get the users the given user is following.
   *     parameters:
   *       - $ref: "#/parameters/fl_id"
   *       - $ref: "#/parameters/fl_limit"
   *       - $ref: "#/parameters/fl_offset"
   *     responses:
   *       200:
   *         $ref: "#/responses/tl_entry"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/users/:id/followings', authorize.requiresAPILogin, followController.getFollowings);

  /**
   * @swagger
   * /api/users/{id}/followings/{tid}:
   *   get:
   *     tags:
   *      - Users
   *      - Follow
   *     description:
   *       Check if a user follows another user
   *     parameters:
   *       - $ref: "#/parameters/fl_id"
   *       - $ref: "#/parameters/fl_tid"
   *     responses:
   *       200:
   *         description: The user id follows the user tid.
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       404:
   *         description: The user id does not follow user tid.
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/users/:id/followings/:tid', authorize.requiresAPILogin, followController.isFollowing);

  /**
   * @swagger
   * /api/users/{id}/followings/{tid}:
   *   put:
   *     tags:
   *      - Users
   *      - Follow
   *     description:
   *       Follow a user.
   *     parameters:
   *       - $ref: "#/parameters/fl_id"
   *       - $ref: "#/parameters/fl_tid"
   *     responses:
   *       201:
   *         $ref: "#/responses/fl_follow"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.put('/users/:id/followings/:tid', authorize.requiresAPILogin, userMiddleware.loadFollowing, userMiddleware.canFollow, followController.follow);

  /**
   * @swagger
   * /api/users/{id}/followings/{tid}:
   *   delete:
   *     tags:
   *      - Users
   *      - Follow
   *     description:
   *       Unfollow a user.
   *     parameters:
   *       - $ref: "#/parameters/fl_id"
   *       - $ref: "#/parameters/fl_tid"
   *     responses:
   *       204:
   *         description:
   *           The user does not follow the other user anymore.
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.delete('/users/:id/followings/:tid', authorize.requiresAPILogin, userMiddleware.loadFollowing, userMiddleware.canUnfollow, followController.unfollow);

};
