'use strict';

var mongoose = require('mongoose');
var emailMessageModule = require('./email');
var whatsupMessageModule = require('./whatsup');
var pubsub = require('../').pubsub.local;

var objectTypeToSchemaName = {
  email: 'EmailMessage',
  whatsup: 'Whatsup'
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

function findByIds(ids, callback) {
  var whatsupModel = mongoose.model('Whatsup');
  var formattedIds = ids.map(function(id) {
    return mongoose.Types.ObjectId(id);
  });
  var query = {
    _id: { $in: formattedIds}
  };
  var result = [];
  var authorsId = [];

  var getAuthors = function(ids, callback) {
    var User = mongoose.model('User');
    var query = {
      _id: { $in: ids}
    };
    User.find(query).exec(callback);
  };

  var saveAuthorId = function(authorId) {
    if (authorsId.indexOf(authorId) < 0) {
      authorsId.push(authorId);
    }
  };

  whatsupModel.collection.find(query).toArray(function(err, foundMessages) {
    if (err) {
      return callback(err);
    }

    foundMessages.forEach(function(foundMessage) {
      saveAuthorId(foundMessage.author);
      if (foundMessage.responses) {
        foundMessage.responses.forEach(function(response) {
          saveAuthorId(response.author);
        });
      }
    });

    getAuthors(authorsId, function(err, authors) {
      if (err) {
        return callback(err);
      }

      foundMessages.forEach(function(message) {
        var Model, instance;
        try {
          Model = getModel(message.objectType);
        } catch (e) {
          return callback(e);
        }
        instance = new Model();

        instance.init(message);

        var getAuthor = function(authorId) {
          return authors.filter(function(user) {
            return user._id.equals(authorId);
          })[0];
        };

        var resultMessage = instance.toObject();
        resultMessage.author = getAuthor(message.author);
        if (resultMessage.responses) {
          resultMessage.responses.forEach(function(response) {
            response.author = getAuthor(response.author);
          });
        }

        result.push(resultMessage);
      });

      return callback(null, result);
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


module.exports = {
  type: {
    email: emailMessageModule,
    whatsup: whatsupMessageModule
  },
  permission: require('./permission'),
  get: get,
  getModel: getModel,
  getInstance: getInstance,
  addNewComment: addNewComment,
  findByIds: findByIds
};
