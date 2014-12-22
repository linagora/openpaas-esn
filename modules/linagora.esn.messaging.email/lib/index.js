'use strict';

var mail = require('./mail');

module.exports = function(dependencies) {

  var lib = {};

  lib.emailTokenModel = require('../backend/db/models/email-recipient-token');

  function validateTo(to, callback) {
    if (!to) {
      return callback(new Error('Address is required'));
    }
    return callback(null, true);
  }

  function getUser(from, callback) {
    var userModule = dependencies('user');
    if (!from) {
      return callback(new Error('User is required'));
    }
    return userModule.findByEmail(from, callback);
  }

  function loadMessage(messageId, callback) {
    if (!messageId) {
      return callback(new Error('Message Id is required'));
    }

    var messageModule = dependencies('message');
    return messageModule.get(messageId, callback);
  }

  function canReply(user, message, callback) {

    if (!user) {
      return callback(new Error('User is required'));
    }

    if (!message) {
      return callback(new Error('Message is required'));
    }

    loadMessage(message._id, function(err, m) {
      if (err) {
        return callback(err);
      }

      var messageModule = dependencies('message');
      return messageModule.permission.canReply(m, user, callback);
    });
  }

  function getReplyTo(to, callback) {
    // need the token service, for now the message to reply to is directly in the email
    if (!to) {
      return callback(new Error('target is required'));
    }

    var targetMessage = to.split('@')[0];
    if (!targetMessage) {
      return callback(new Error('Can not get the replyTo from the target email'));
    }

    // for now message is like whatsup+98393893893, then we will have token-based stuff
    var replyTo = targetMessage.split('+');
    return callback(null, {_id: replyTo[1], objectType: replyTo[0]});
  }

  function parseMessage(stream, callback) {
    return mail.parse(stream, callback);
  }

  function reply(message, inReplyTo, user, callback) {
    var messageModule = dependencies('message');
    var helpersModule = dependencies('helpers');

    var publishCommentActivity = function(parentMessage, childMessage) {
      helpersModule.message.publishCommentActivity(user, inReplyTo, parentMessage, childMessage);
    };

    if (!inReplyTo) {
      return callback(new Error('Missing inReplyTo'));
    }

    var replyMessage = {
      content: message.body.text,
      author: user._id,
      source: 'email'
    };

    var comment;
    try {
      comment = messageModule.getInstance('whatsup', replyMessage);
    } catch (e) {
      return callback(e);
    }

    messageModule.addNewComment(comment, inReplyTo, function(err, childMessage, parentMessage) {
      if (err) {
        return callback(err);
      }

      if (message.attachments && message.attachments.length > 0) {
        return messageModule.setAttachmentsReferences(message, function(err) {
          if (err) {
            // warn
          }
          publishCommentActivity(parentMessage, childMessage);
          return callback(null, { _id: childMessage._id, parentId: parentMessage._id});
        });
      } else {
        publishCommentActivity(parentMessage, childMessage);
        return callback(null, {_id: childMessage._id, parentId: parentMessage._id });
      }
    });
  }

  lib.getUser = getUser;
  lib.canReply = canReply;
  lib.parseMessage = parseMessage;
  lib.reply = reply;
  lib.getReplyTo = getReplyTo;
  lib.validateTo = validateTo;
  lib.token = require('./token')(lib, dependencies);
  lib.sender = require('./sender')(lib, dependencies);

  return lib;
};
