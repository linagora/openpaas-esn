'use strict';

const authorize = require('../middleware/authorization');
const users = require('../controllers/users');
const usersMW = require('../middleware/users');
const { loadFromDomainIdParameter } = require('../middleware/domain');
const link = require('../middleware/profile-link');

module.exports = function(router) {

  /**
   * @swagger
   * /users/{uuid}:
   *   get:
   *     tags:
   *      - Users
   *     description: |
   *       Get the profile of the user with given uuid.
   *
   *       If the user targeted is not the one who requested the profile, private keys are not included in the response.
   *
   *       Private keys are : accounts.
   *     parameters:
   *       - $ref: "#/parameters/uss_uuid"
   *     responses:
   *       200:
   *         $ref: "#/responses/uss_profile"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/users/:uuid', authorize.requiresAPILogin, users.profile);

  /**
   * @swagger
   * /users/{uuid}:
   *   put:
   *     tags:
   *      - Users
   *      - Profile
   *     description: |
   *       Update profile of a specific user with given uuid.
   *     parameters:
   *       - $ref: "#/parameters/uss_uuid"
   *       - $ref: "#/parameters/dm_id_in_query"
   *       - name: profile
   *         in: body
   *         schema:
   *           $ref: "#/definitions/Profile"
   *         description: The new profile value attributes
   *         required: true
   *     responses:
   *       200:
   *         $ref: "#/responses/us_update_profile"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.put('/users/:uuid',
    authorize.requiresAPILogin,
    loadFromDomainIdParameter,
    authorize.requiresDomainManager,
    usersMW.loadTargetUser,
    authorize.requiresTargetUserIsDomainMember,
    users.updateTargetUserProfile
  );

  /**
   * @swagger
   * /users:
   *   get:
   *     tags:
   *      - Users
   *     description: |
   *       Get the users profile from query.
   *     parameters:
   *       - $ref: "#/parameters/cm_limit"
   *       - $ref: "#/parameters/cm_offset"
   *       - $ref: "#/parameters/cm_search"
   *       - $ref: "#/parameters/uss_email"
   *     responses:
   *       200:
   *         $ref: "#/responses/uss_profile"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       403:
   *         $ref: "#/responses/cm_403"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/users',
    authorize.requiresAPILogin,
    usersMW.requireProfilesQueryParams,
    usersMW.checkProfilesQueryPermission,
    users.getProfilesByQuery);

  /**
   * @swagger
   * /users/{uuid}/profile:
   *   get:
   *     tags:
   *      - Users
   *     description: |
   *       Get the profile of the user with given uuid, and keep trace of the user requested.
   *
   *       If the user targeted is not the one who requested the profile, private keys are not included in the response.
   *
   *       Private keys are : accounts.
   *     parameters:
   *       - $ref: "#/parameters/uss_uuid"
   *     responses:
   *       200:
   *         $ref: "#/responses/uss_profile"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/users/:uuid/profile', authorize.requiresAPILogin, link.trackProfileView, users.profile);

  /**
   * @swagger
   * /users/{uuid}/profile/avatar:
   *   get:
   *     tags:
   *      - Users
   *     description: Get the avatar of the user for the given id, or or a default avatar if no avatar defined for this user.
   *     parameters:
   *       - $ref: "#/parameters/uss_uuid"
   *       - $ref: "#/parameters/av_if_modified_since"
   *     responses:
   *       200:
   *         $ref: "#/responses/uss_avatar"
   *       304:
   *         $ref: "#/responses/cm_304"
   *       404:
   *         $ref: "#/responses/cm_404"
   */
  router.get('/users/:uuid/profile/avatar', usersMW.loadTargetUser, users.getTargetUserAvatar);
};
