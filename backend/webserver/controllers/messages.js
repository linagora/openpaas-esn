'use strict';

var async = require('async');
var q = require('q');
var messageModule = require('../../core/message'),
    emailModule = require('../../core/message/email'),
    postToModel = require(__dirname + '/../../helpers/message').postToModelMessage,
    publishCommentActivityHelper = require('../../helpers/message').publishCommentActivity,
    messageSharesToTimelineTarget = require('../../helpers/message').messageSharesToTimelineTarget,
    publishMessageEvents = require('../../helpers/message').publishMessageEvents,
    denormalizer = require('./messages.denormalize'),
    logger = require('../../core/logger'),
    localpubsub = require('../../core/pubsub').local,
    globalpubsub = require('../../core/pubsub').global;

function denormalize(user, message) {
  return denormalizer.denormalize(message, {user: user});
}

function createNewMessage(message, req, res) {
  function finishMessageResponse(err, savedMessage) {
    if (err) {
      logger.warn('Can not set attachment references', err);
    }

    publishMessageEvents(savedMessage, req.body.targets, req.user, 'post');
    res.status(201).json({ _id: savedMessage._id });
  }

  messageModule.getInstance(message.objectType, message).save(function(err, saved) {
    if (err) {
      var errorData = { error: { status: 500, message: 'Server Error', details: 'Cannot create message . ' + err.message }};
      return res.status(500).json(errorData);
    }

    if (!saved) {
      return res.status(404).end();
    }

    if (message.attachments && message.attachments.length > 0) {
      var attachCallback = function(err) { finishMessageResponse(err, saved); };
      return messageModule.setAttachmentsReferences(saved, attachCallback);
    } else {
      finishMessageResponse(null, saved);
    }
  });
}

function commentMessage(message, inReplyTo, req, res) {

  var publishCommentActivity = function(parentMessage, childMessage) {
    publishCommentActivityHelper(req.user, inReplyTo, parentMessage, childMessage);
  };

  var comment;
  if (!inReplyTo._id) {
    return res.status(400).json({ error: { status: 400, message: 'Bad parameter', details: 'Missing inReplyTo _id in body'}});
  }
  try {
    comment = messageModule.getInstance(message.objectType, message);
  } catch (e) {
    return res.status(400).json({ error: { status: 400, message: 'Bad parameter', details: 'Unknown message type ' + message.objectType}});
  }
  messageModule.addNewComment(comment, inReplyTo, function(err, childMessage, parentMessage) {
    if (err) {
      return res.status(500).json({ error: { status: 500, message: 'Server Error', details: 'Cannot add commment. ' + err.message } });
    }

    if (message.attachments && message.attachments.length > 0) {
      return messageModule.setAttachmentsReferences(message, function(err) {
        if (err) {
          logger.warn('Can not set attachment references', err);
        }
        publishCommentActivity(parentMessage, childMessage);
        return res.status(201).json({ _id: childMessage._id, parentId: parentMessage._id });
      });
    } else {
      publishCommentActivity(parentMessage, childMessage);
      return res.status(201).json({ _id: childMessage._id, parentId: parentMessage._id });
    }
  });
}

function create(req, res) {
  if (!req.user || !req.user.emails || !req.user.emails.length) {
    return res.status(500).json({ error: { status: 500, message: 'Server Error', details: 'User is not set.'}});
  }

  if (!req.body) {
    return res.status(400).json('Missing message in body');
  }

  if (req.message_targets) {
    req.body.targets = req.message_targets;
  }

  var message = postToModel(req.body, req.user);

  if (req.body.inReplyTo) {
    commentMessage(message, req.body.inReplyTo, req, res);
  } else {
    createNewMessage(message, req, res);
  }
}

/**
 * Get messages with its ids.
 *
 * @param {string[]} messageIds the messages ids to find
 * @param {User} user who want to read the messages.
 * @param {function} callback fn like callback(err, object) where object is {messages: [object], messagesNotFound: [object]}
 */
function getMessages(messageIds, user, callback) {
  messageModule.findByIds(messageIds, function(err, messagesFound) {
    if (err) {
      return callback(err);
    }
    if (!messagesFound) {
      return callback(new Error('Error when find messages by ids'));
    }

    var messagesNotFound = [];
    var foundIds = messagesFound.map(function(message) {
      return message._id.toString();
    });
    messageIds.filter(function(id) {
      return foundIds.indexOf(id) < 0;
    }).forEach(function(id) {
      messagesNotFound.push({ error: { code: 404, message: 'Not Found', details: 'The message ' + id + ' can not be found'}});
    });

    async.concat(messagesFound, function(message, callback) {
      messageModule.permission.canRead(message, {objectType: 'user', id: user._id}, function(err, readable) {
        if (err) {
          return callback(null, [{ error: { code: 500, message: 'Server Error when checking the read permission', details: err.message}}]);
        }
        if (!readable) {
          return callback(null, [{ error: { code: 403, message: 'Forbidden', details: 'You do not have the permission to read message ' + message._id.toString()}}]);
        }

        messageModule.canReadMessageFromStatus(message, user, function(err, readable) {
          if (err) {
            return callback(null, [{ error: { code: 500, message: 'Server Error when checking the read status permission', details: err.message}}]);
          }

          if (!readable) {
            return callback(null, []);
          }

          messageModule.filterReadableResponses(message, user, function(err, messageFiltered) {
            if (err) {
              return callback(null, [{ error: { code: 500, message: 'Server Error when checking the read permission', details: err.message}}]);
            }
            return callback(null, [messageFiltered]);
          });
        });
      });
    }, function(err, messages) {
      return callback(err, {
        messages: messages,
        messagesNotFound: messagesNotFound
      });
    });
  });
}

function get(req, res) {
  if (!req.user || !req.user.emails || !req.user.emails.length) {
    return res.status(500).json({ error: { code: 500, message: 'Server Error', details: 'User can not be set.'}});
  }

  if (!req.query || !req.query.ids) {
    return res.status(400).json('Missing ids in query');
  }
  var messageIds = req.query.ids;

  getMessages(messageIds, req.user, function(err, messagesObject) {
    if (err) {
      return res.status(500).json({ error: { code: 500, message: 'Server Error', details: 'Cannot get messages. ' + err.message}});
    }
    var messagesFound = messagesObject.messages;
    var messagesNotFound = messagesObject.messagesNotFound;

    if (messagesFound && messagesFound.length > 0) {

      var promises = messagesFound.map(function(message) {
        return denormalize(req.user, message);
      });

      return q.all(promises).then(function(messages) {
        res.status(200).json(messages.concat(messagesNotFound));
      }, function(err) {
        logger.error('Error while denormalizing messages', err);
        res.status(200).json(messagesFound.concat(messagesNotFound));
      });
    }

    return res.status(404).json(messagesNotFound);
  });
}

function getOne(req, res) {
  if (!req.params.id) {
    return res.status(400).json({ error: { code: 400, message: 'Bad request', details: 'Message ID is required'}});
  }

  var id = req.params.id;

  getMessages([id], req.user, function(err, messagesObject) {
    if (err) {
      return res.status(500).json({ error: { code: 500, message: 'Server Error', details: 'Cannot get message. ' + err.message}});
    }
    var messagesFound = messagesObject.messages;
    var messagesNotFound = messagesObject.messagesNotFound;

    if (messagesFound && messagesFound.length > 0) {
      return denormalize(req.user, messagesFound[0])
        .then(denormalized => res.status(200).json(denormalized))
        .catch(err => {
          logger.warn('Can not denormalize message', err);
          res.status(200, messagesFound[0]);
        });
    }

    res.status(404).json(messagesNotFound[0]);
  });
}

function copy(req, res) {
  var id = req.params.id;
  var resource = req.body.resource;
  var target = req.body.target;

  messageModule.copy(id, req.user._id, resource, target, function(err, copy) {
    if (err) {
      return res.status(500).json({ error: { code: 500, message: 'Server Error', details: 'Cannot copy message. ' + err.message}});
    }

    if (!copy) {
      return res.status(404).json({ error: { code: 404, message: 'Message not found', details: 'Message has not been found ' + id}});
    }

    publishMessageEvents(copy, req.body.target, req.user, 'post');
    res.status(201).json({ _id: copy._id});
  });
}

function createMessageFromEmail(req, res) {

  var objectType = req.query.objectType;
  if (!objectType) {
    return res.status(400).json({ error: { status: 400, message: 'Bad request', details: 'objectType is mandatory'}});
  }

  var id = req.query.id;
  if (!id) {
    return res.status(400).json({ error: { status: 400, message: 'Bad request', details: 'ID is mandatory'}});
  }

  var shares = [{objectType: objectType, id: id}];
  emailModule.saveEmail(req, req.user, shares, function(err, email) {
    if (err) {
      return res.status(500).json({ error: { status: 500, message: 'Server error', details: err.message}});
    }

    if (email) {
      var targets = messageSharesToTimelineTarget(email.shares);
      var activity = require('../../core/activitystreams/helpers').userMessageToTimelineEntry(email, 'post', req.user, targets);
      localpubsub.topic('message:activity').publish(activity);
      globalpubsub.topic('message:activity').publish(activity);
      return res.status(201).json({ _id: email._id});
    }
    return res.status(404).json({ error: { status: 404, message: 'Not found', details: 'Can not find created message'}});
  });
}

module.exports = {
  createOrReplyToMessage: create,
  getMessages: get,
  getMessage: getOne,
  copy: copy,
  createMessageFromEmail: createMessageFromEmail
};
