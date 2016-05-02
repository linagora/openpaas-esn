'use strict';

var authorize = require('../middleware/authorization');
var requestMW = require('../middleware/request');
var activitystreams = require('../controllers/activitystreams');
var asMiddleware = require('../middleware/activitystream');

module.exports = function(router) {
  router.get('/activitystreams/:uuid', authorize.requiresAPILogin, requestMW.requireRouteParams('uuid'), asMiddleware.findStreamResource, requestMW.assertRequestElementNotNull('activity_stream'), activitystreams.get);
  router.get('/activitystreams/:uuid/unreadcount', authorize.requiresAPILogin, requestMW.requireRouteParams('uuid'), asMiddleware.findStreamResource, requestMW.assertRequestElementNotNull('activity_stream'), activitystreams.getUnreadCount);
  router.get('/user/activitystreams', authorize.requiresAPILogin, activitystreams.getMine);
  router.get('/activitystreams/:uuid/resource', authorize.requiresAPILogin, requestMW.requireRouteParams('uuid'), asMiddleware.findStreamResource, requestMW.assertRequestElementNotNull('activity_stream'), activitystreams.getResource);
};
