'use strict';

var authorize = require('../middleware/authorization');
var users = require('../controllers/users');
var features = require('../middleware/features');
var usernotifications = require('../controllers/usernotifications');
var usernotificationsAsMiddleware = require('../middleware/usernotifications');
var oauthclients = require('../controllers/oauthclients');

module.exports = function(router) {

  /**
   * @swagger
   * /api/user:
   *   get:
   *     tags:
   *      - User
   *     description: Get the authenticated user informations.
   *     security:
   *       - openpaas_auth : []
   *     responses:
   *       "200":
   *         description: Success
   *         schema:
   *           $ref: "#/definitions/UserInformationResponse"
   *         examples:
   *           application/json:
   *             {
       *               _id: 123456789,
       *               firstname: "John",
       *               lastname: "Doe",
       *               emails: ["johndoe@linagora.com"]
       *             }
   *       "401":
   *         description: Unauthorized. The current request does not contains any valid data to be used for authentication.
   *       default:
   *         description: unexpected error
   *         schema:
   *           $ref: "#/definitions/ErrorResponse"
   */
  router.get('/user', authorize.requiresAPILogin, features.loadFeaturesForUser, users.user);

  /**
   * @swagger
   * /api/user/profile :
   *   get:
   *     tags:
   *      - User
   *      - Profile
   *     description: Get the current user profile.
   *     responses:
   *       "200":
   *         description: Success
   *         schema:
   *           $ref: "#/definitions/UserProfileResponse"
   *         examples:
   *           application/json:
   *             {
       *               "firstname": "John",
       *               "lastname": "Doe",
       *               "job_title": "Manager",
       *               "service": "Sales",
       *               "phone": "+33467455653222"
       *             }
   *       "401":
   *         description: Unauthorized.
   *       default:
   *         description: Error
   *         schema:
   *           $ref: "#/definitions/ErrorResponse"
   */
  router.get('/user/profile', authorize.requiresAPILogin, users.user);

  /**
   * @swagger
   * /api/user/profile/{attribute_name} :
   *   put:
   *     tags:
   *      - User
   *      - Profile
   *     description: Update an element of the current user profile.
   *     parameters:
   *       - name: attribute_name
   *         in: path
   *         description: The attribute name of the element to update (firstname, lastname, ...)
   *         required: true
   *         type: string
   *         enum:
   *           - firstname
   *           - lastname
   *           - job_title
   *           - service
   *           - phone
   *       - name: attribute_value
   *         in: body
   *         schema:
   *           $ref: "#/definitions/ProfileValue"
   *         description: The attribute value of the element to update
   *         required: true
   *     responses:
   *       200:
   *         description: Success. The profile element has been updated.
   *         examples:
   *           application/json:
   *             {
     *               firstname: "John",
     *               lastname: "Doe",
     *               job_title: "Manager",
     *               service: "Sales",
     *               phone: "+33467455653222"
     *             }
   *       400:
   *         description: Bad Request.
   *       401:
   *         description: Unauthorized. The current user does not have rights to update the user profile.
   *       default:
   *         description: Error
   *         schema:
   *           $ref: "#/definitions/ErrorResponse"
   */
  router.put('/user/profile/:attribute', authorize.requiresAPILogin, users.updateProfile);

  router.post('/user/profile/avatar', authorize.requiresAPILogin, users.postProfileAvatar);
  router.get('/user/profile/avatar', authorize.requiresAPILogin, users.getProfileAvatar);

  /**
   * @swagger
   * /api/user/oauth/clients:
   *   get:
   *     tags:
   *      - OAuth
   *      - User
   *     description: |
   *       List all of the OAuth clients created by the current user.
   *       Check the OAuth API for more details on OAuth support.
   *     responses:
   *       "200":
   *         description: Success. An array of OAuth clients the current user created.
   *         schema:
   *           type: array
   *           items:
   *             $ref: "#/definitions/OAuthClientResponse"
   *         examples:
   *           application/json:
   *             [
   *               {
     *                 "_id":"54189f0c5375449a5d17f3d9",
     *                 "clientSecret":"OwISwURuiJ1KhBgRIgPdQNbMzyIpA9AEyuHTCRQH",
     *                 "clientId":"t0m0s3SS1cDLEVBK7pvL",
     *                 "name":"Twitter Streaming App",
     *                 "redirectUri":"http://twitter.com/oauth/",
     *                 "description":"Let's stream tweets",
     *                 "creator":"5375de9fd684db7f6fbd5010",
     *                 "__v":0,
     *                 "schemaVersion":1,
     *                 "created":"2014-09-16T20:35:24.643Z"
     *               }
   *             ]
   *       "400":
   *         description: Bad request
   *       "500":
   *         description: Internal server error - Something went bad on the server side.
   *       default:
   *         description: Error
   *         schema:
   *           $ref: "#/definitions/ErrorResponse"
   */
  router.get('/user/oauth/clients', authorize.requiresAPILogin, oauthclients.created);

  router.get('/user/notifications', authorize.requiresAPILogin, usernotifications.list);
  router.get('/user/notifications/unread', authorize.requiresAPILogin, usernotifications.getUnreadCount);
  router.put('/user/notifications/:id/read', authorize.requiresAPILogin, usernotifications.load, usernotificationsAsMiddleware.userCanWriteNotification, usernotifications.setRead);
  router.put('/user/notifications/:id/acknowledged', authorize.requiresAPILogin, usernotifications.load, usernotificationsAsMiddleware.userCanWriteNotification, usernotifications.setAcknowledged);
  router.put('/user/notifications/read', authorize.requiresAPILogin, usernotifications.loadAll, usernotificationsAsMiddleware.userCanReadAllNotifications, usernotifications.setAllRead);
};
