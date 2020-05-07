'use strict';

const authorize = require('../middleware/authorization');
const users = require('../controllers/users');
const usersMW = require('../middleware/users');
const { loadFromDomainIdParameter, loadSessionDomain } = require('../middleware/domain');
const { validateMIMEType } = require('../middleware/file');
const { ACCEPTED_MIME_TYPES } = require('../../core/image').CONSTANTS;
const helperMW = require('../middleware/helper');
const link = require('../middleware/profile-link');
const { requireInQuery } = require('../middleware/helper');

module.exports = function(router) {

  /**
   * @swagger
   * /api/users/{uuid}:
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
    usersMW.validateUserUpdateOnReq('targetUser'),
    users.updateUserProfileOnReq('targetUser')
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

  /**
   * @swagger
   * /users/{uuid}/profile/avatar:
   *   put:
   *     tags:
   *       - Avatar
   *       - User
   *     description: |
   *       Update avatar for a specific user. The updated avatar is set as the default avatar for that user.
   *
   *       The image should be square, and at least be 128x128 px.
   *     parameters:
   *       - $ref: "#/parameters/uss_uuid"
   *       - $ref: "#/parameters/av_mimetype"
   *       - $ref: "#/parameters/av_size"
   *       - $ref: "#/parameters/ct_raw_data"
   *       - $ref: "#/parameters/dm_id_in_query"
   *     responses:
   *       200:
   *         $ref: "#/responses/ct_avatar"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       403:
   *         $ref: "#/responses/cm_403"
   *       412:
   *         $ref: "#/responses/cm_412"
   *       415:
   *         $ref: "#/responses/cm_415"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.put(
    '/users/:uuid/profile/avatar',
    authorize.requiresAPILogin,
    loadFromDomainIdParameter,
    authorize.requiresDomainManager,
    usersMW.loadTargetUser,
    authorize.requiresTargetUserIsDomainMember,
    helperMW.requireInQuery(['mimetype', 'size']),
    validateMIMEType(ACCEPTED_MIME_TYPES),
    helperMW.requirePositiveIntegersInQuery('size'),
    users.updateTargetUserAvatar
  );

  /**
   * @swagger
   * /users/{uuid}/states:
   *   put:
   *     tags:
   *      - Users
   *      - States
   *     description: Update states of the user for the given id
   *     parameters:
   *       - $ref: "#/parameters/uss_states"
   *       - $ref: "#/parameters/uss_uuid"
   *       - $ref: "#/parameters/dm_id_in_query"
   *     responses:
   *       204:
   *         $ref: "#/responses/cm_204"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       403:
   *         $ref: "#/responses/cm_403"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.put('/users/:uuid/states',
    authorize.requiresAPILogin,
    loadFromDomainIdParameter,
    authorize.requiresDomainManager,
    usersMW.loadTargetUser,
    authorize.requiresTargetUserIsDomainMember,
    helperMW.requireBodyAsArray,
    usersMW.validateUserStates,
    users.updateStates
  );

  /**
   * @swagger
   * /users/{uuid}/emails:
   *   put:
   *     tags:
   *      - Users
   *      - Emails
   *     description: Update emails of the user for the given id
   *     parameters:
   *       - $ref: "#/parameters/uss_emails"
   *       - $ref: "#/parameters/uss_uuid"
   *       - $ref: "#/parameters/dm_id_in_query"
   *     responses:
   *       204:
   *         $ref: "#/responses/cm_204"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       403:
   *         $ref: "#/responses/cm_403"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.put('/users/:uuid/emails',
    authorize.requiresAPILogin,
    loadFromDomainIdParameter,
    authorize.requiresDomainManager,
    usersMW.canManageUserEmails,
    usersMW.loadTargetUser,
    authorize.requiresTargetUserIsDomainMember,
    helperMW.requireBodyAsArray,
    usersMW.requirePreferredEmail,
    usersMW.checkEmailsAvailability,
    users.updateTargetUserEmails
  );

  /**
   * @swagger
   * /users/provision:
   *   post:
   *     tags:
   *      - Users
   *     description: Create or Update user from a provision source
   *     parameters:
   *       - $ref: "#/parameters/uss_provision_source"
   *       - $ref: "#/parameters/uss_provision_data"
   *     responses:
   *       204:
   *         $ref: "#/responses/cm_201"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.post('/users/provision',
    authorize.requiresAPILogin,
    loadSessionDomain,
    requireInQuery('source'),
    usersMW.validateUsersProvision,
    users.provision
  );
};
