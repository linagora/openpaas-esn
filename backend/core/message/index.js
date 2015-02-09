'use strict';

var mongoose = require('mongoose');
var async = require('async');
var attachments = require('./attachments');
var emailMessageModule = require('./email');
var whatsupMessageModule = require('./whatsup');
var organizationalMessageModule = require('./organizational');
var pollMessageModule = require('./poll');
var pubsub = require('../').pubsub.local;

var MESSAGES_COLLECTION = 'messages';

var objectTypeToSchemaName = {
  email: 'EmailMessage',
  whatsup: 'Whatsup',
  event: 'EventMessage',
  organizational: 'OrganizationalMessage',
  poll: 'PollMessage'
};

var type = {
  email: emailMessageModule,
  whatsup: whatsupMessageModule,
  organizational: organizationalMessageModule,
  poll: pollMessageModule
};

function getModel(objectType) {
  var modelName = objectTypeToSchemaName[objectType];
  if (!modelName) {
    throw new Error('Unkown object type: ', objectType);
  }
  return mongoose.model(modelName);
}

function getInstance(objectType, message) {
  var Model;
  Model = getModel(objectType);
  return new Model(message);
}

function collectAuthors(messages, authorsMap) {
  var authors = authorsMap || Object.create(null);

  messages.forEach(function(message) {
    if (message.author in authors) {
      authors[message.author].push(message);
    } else {
      authors[message.author] = [message];
    }

    if (message.responses) {
      collectAuthors(message.responses, authors);
    }
  });

  return authors;
}

function applyAuthors(authorsMap, authors) {
  authors.forEach(function(author) {
    authorsMap[author._id].forEach(function(message) {
      message.author = author;
    });
  });
}

function get(uuid, callback) {
  var whatsupModel = mongoose.model('Whatsup');
  var ouuid = new mongoose.Types.ObjectId(uuid);
  whatsupModel.collection.findOne({_id: ouuid}, function(err, doc) {
    if (err) {
      return callback(err);
    }
    if (!doc) {
      return callback(new Error('Document not found (id = ' + uuid + ')'));
    }
    var Model, instance;
    try {
      Model = getModel(doc.objectType);
    } catch (e) {
      return callback(e);
    }
    instance = new Model();
    instance.init(doc);
    return callback(null, instance);
  });
}

function getWithAuthors(uuid, callback) {
  return get(uuid, function(err, instance) {
    if (err) { return callback(err); }

    var doc = instance.toObject();
    var userModel = mongoose.model('User');

    var authorsMap = collectAuthors([doc]);
    var ids = Object.keys(authorsMap).map(function(id) {
      return mongoose.Types.ObjectId(id);
    });

    return userModel.find({ _id: { '$in': ids } }).exec(function(err, authors) {
      if (err) { return callback(err); }

      applyAuthors(authorsMap, authors);
      return callback(null, doc);
    });
  });
}

function copy(id, sharerId, resource, target, callback) {

  function getOriginal(callback) {
    mongoose.connection.db.collection(MESSAGES_COLLECTION, function(err, collection) {
      var query = {
        $or: [
          {_id: mongoose.Types.ObjectId(id)},
          {'responses._id': mongoose.Types.ObjectId(id)}
        ]
      };
      collection.findOne(query, function(err, message) {
        if (!message) {
          return callback(null, null);
        }
        var targetMessage = null;
        if (message._id.equals(id)) {
          targetMessage = message;
        } else {
          targetMessage = message.responses.filter(function(response) {
            return response._id.equals(id);
          })
          .pop();
        }
        return callback(null, {root: message, target: targetMessage});
      });
    });
  }

  function update(original, callback) {

    var copyOf = original.target.copyOf || {};
    copyOf.target = original.target.copyOf ? original.target.copyOf.target || [] : [];
    copyOf.target = copyOf.target.concat(target);

    if (original.root._id.equals(id)) {
      return getModel(original.target.objectType).update({_id: original.target._id}, {$set: {copyOf: copyOf} }, callback);
    } else {
      return getModel(original.target.objectType).update({_id: original.root._id, 'responses._id': mongoose.Types.ObjectId(id)}, {$set: {'responses.$.copyOf': copyOf} }, callback);
    }
  }

  function doCopy(original, callback) {
    var copy = original.target;
    copy._id = new mongoose.Types.ObjectId();
    copy.copyOf = {
      origin: {
        resource: resource,
        message: mongoose.Types.ObjectId(id),
        sharer: mongoose.Types.ObjectId(sharerId),
        timestamps: {
          creation: new Date()
        }
      }
    };
    copy.shares = target;
    delete copy.responses;
    var instance = getInstance(copy.objectType, copy);
    instance.save(callback);
  }

  getOriginal(function(err, original) {
    if (err) {
      return callback(err);
    }

    if (!original) {
      return callback(null, null);
    }

    async.parallel([
      update.bind(null, original),
      doCopy.bind(null, original)
    ], function(err, result) {
      if (err) {
        return callback(err);
      }
      return callback(err, result[1][0]);
    });
  });
}

function findByIds(ids, callback) {
  var whatsupModel = mongoose.model('Whatsup');
  var formattedIds = ids.map(function(id) {
    return mongoose.Types.ObjectId(id);
  });
  var query = { _id: { $in: formattedIds } };

  whatsupModel.collection.find(query).toArray(function(err, foundMessages) {
    if (err) {
      return callback(err);
    }

    var authorsMap = collectAuthors(foundMessages);
    var ids = Object.keys(authorsMap).map(function(id) {
      return mongoose.Types.ObjectId(id);
    });

    var userModel = mongoose.model('User');
    var query = { _id: { $in: ids} };
    userModel.find(query).exec(function(err, authors) {
      if (err) { return callback(err); }

      applyAuthors(authorsMap, authors);
      return callback(null, foundMessages);
    });
  });
}

function addNewComment(message, inReplyTo, callback) {
  get(inReplyTo._id, function(err, parent) {
    if (err) {
      return callback(err);
    }
    parent.responses.push(message);
    parent.save(function(err, parent) {
      var topic = pubsub.topic('message:comment');
      if (err) {
        return callback(err);
      }
      message.inReplyTo = inReplyTo;
      topic.publish(message);
      callback(null, message, parent);
    });
  });
}

function setAttachmentsReferences(message, callback) {
  if (!message) {
    return callback(new Error('Message is required'));
  }

  if (!message.attachments || message.attachments.length === 0) {
    return callback();
  }

  var failures = [];
  async.each(message.attachments, function(attachment, done) {
    attachments.setMessageReference(attachment, message, function(err) {
      if (err) {
        failures.push(attachment);
      }
      return done();
    });
  }, function() {
    if (failures.length > 1) {
      return callback(new Error('Fail to set references for attachments', failures));
    }
    return callback();
  });
}

function specificModelCheckForObjectType(objectType, messageModel, messageTargets, callback) {
  if (!objectType || !type[objectType] || !type[objectType].checkModel) {
    return callback();
  } else {
    return type[objectType].checkModel(messageModel, messageTargets, callback);
  }
}

function typeSpecificReplyPermission(message, user, replyData, callback) {
  var objectType = message.objectType;
  if (!objectType || !type[objectType] || !type[objectType].checkReplyPermission) {
    return callback(null, true);
  } else {
    return type[objectType].checkReplyPermission(message, user, replyData, callback);
  }
}

function filterReadableResponses(message, user, callback) {
  var objectType = message.objectType;
  if (!objectType || !type[objectType] || !type[objectType].filterReadableResponses) {
    return callback(null, message);
  } else {
    return type[objectType].filterReadableResponses(message, user, callback);
  }
}

module.exports = {
  type: type,
  permission: require('./permission'),
  attachments: attachments,
  get: getWithAuthors,
  dryGet: get,
  copy: copy,
  getModel: getModel,
  getInstance: getInstance,
  addNewComment: addNewComment,
  findByIds: findByIds,
  setAttachmentsReferences: setAttachmentsReferences,
  specificModelCheckForObjectType: specificModelCheckForObjectType,
  typeSpecificReplyPermission: typeSpecificReplyPermission,
  filterReadableResponses: filterReadableResponses
};
