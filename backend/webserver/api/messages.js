'use strict';

var authorize = require('../middleware/authorization');
var requestMW = require('../middleware/request');
var messages = require('../controllers/messages');
var pollMessages = require('../controllers/poll-messages');
var messageMiddleware = require('../middleware/message');
var asMiddleware = require('../middleware/activitystream');

module.exports = function(router) {
  router.get('/messages', authorize.requiresAPILogin, messages.getMessages);
  router.post('/messages', authorize.requiresAPILogin, messageMiddleware.canReplyTo, asMiddleware.filterWritableTargets,
    messageMiddleware.checkTargets, messageMiddleware.checkMessageModel, messages.createOrReplyToMessage);
  router.get('/messages/:id', authorize.requiresAPILogin, messages.getMessage);
  router.post('/messages/:id/shares', authorize.requiresAPILogin, messageMiddleware.canShareFrom, messageMiddleware.canShareTo, messages.copy);
  router.post('/messages/email', authorize.requiresAPILogin, asMiddleware.isValidStream, messages.createMessageFromEmail);
  router.put('/messages/:id/vote/:vote', authorize.requiresAPILogin, requestMW.castParamToObjectId('id'), pollMessages.vote);
};
