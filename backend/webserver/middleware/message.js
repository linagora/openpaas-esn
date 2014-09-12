'use strict';

var messagePermission = require('../../core/message/permission');
var messageModule = require('../../core/message');

module.exports.canReplyTo = function(req, res, next) {
  var inReplyTo = req.body.inReplyTo;
  if (inReplyTo) {
    messageModule.get(inReplyTo._id, function(err, message) {
      if (err || !message) {
        return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Can not find message to reply to'}});
      }

      messagePermission.canReply(message, req.user, function(err, result) {
        if (result) {
          return next();
        }
        return res.json(403, {error: {code: 403, message: 'Forbidden', details: 'You can not reply to this message'}});
      });
    });
  } else {
    next();
  }
};
