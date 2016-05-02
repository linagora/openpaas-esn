'use strict';

var authorize = require('../middleware/authorization');
var requestMW = require('../middleware/request');
var communities = require('../controllers/communities');
var communityMiddleware = require('../middleware/community');
var domainMiddleware = require('../middleware/domain');

module.exports = function(router) {
  router.get('/communities', authorize.requiresAPILogin, domainMiddleware.loadFromDomainIdParameter, authorize.requiresDomainMember, communities.list);
  router.get('/communities/:id', authorize.requiresAPILogin, communities.load, communities.get);
  router.get('/communities/:id/avatar', authorize.requiresAPILogin, communities.load, communities.getAvatar);
  router.post('/communities', authorize.requiresAPILogin, communities.loadDomainForCreate, authorize.requiresDomainMember, communities.create);
  router.post('/communities/:id/avatar', authorize.requiresAPILogin, communities.load, authorize.requiresCommunityCreator, communities.uploadAvatar);
  router.delete('/communities/:id', authorize.requiresAPILogin, communities.load, authorize.requiresCommunityCreator, communities.delete);
  router.get('/communities/:id/members/:user_id',
    authorize.requiresAPILogin,
    communities.load,
    communityMiddleware.canRead,
    requestMW.castParamToObjectId('user_id'),
    communities.getMember
  );

  /**
   * @swagger
   * /api/user/communities:
   *   get:
   *     tags:
   *      - User
   *      - Communities
   *     description: |
   *       List all of the communities across all of the domains to which the authenticated user belongs.
   *       Check the Community API for more details on communities.
   *     responses:
   *       "200":
   *         description: Success. An array of community objects the current user belongs to.
   *         schema:
   *           type: array
   *           items:
   *             $ref: "#/definitions/CommunityResponse"
   *         examples:
   *           application/json:
   *             [
   *               {
     *                 "_id": "987654321",
     *                 "title": "Mean",
     *                 "description": "The Awesome MEAN stack",
     *                 "domain_ids": ["8292903883939282"],
     *                 "timestamps": {
     *                   "creation": "2014-05-16T09:47:11.703Z"
     *                 },
     *                 activity_stream: {
     *                   uuid: "9330-0393-7373-7280",
     *                   "timestamps": {
     *                     "creation": "2014-05-16T09:47:11.704Z",
     *                   }
     *                 }
     *               },
   *               {
     *                 "_id": "123456789",
     *                 "title": "Node.js",
     *                 "description": "All about node.js",
     *                 "domain_ids": ["8292903883939282"],
     *                 "timestamps": {
     *                   "creation": "2014-05-16T09:47:11.703Z"
     *                 },
     *                 activity_stream: {
     *                   uuid: "9330-0393-7373-7280",
     *                   "timestamps": {
     *                     "creation": "2014-05-16T09:47:11.704Z"
     *                   }
     *                 }
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
  router.get('/user/communities', authorize.requiresAPILogin, communities.getMine);
};
