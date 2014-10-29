'use strict';

var mongoose = require('mongoose');
var emailMessageModule = require('./email');
var whatsupMessageModule = require('./whatsup');
var pubsub = require('../').pubsub.local;

var objectTypeToSchemaName = {
  email: 'EmailMessage',
  whatsup: 'Whatsup',
  event: 'EventMessage'
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


module.exports = {
  type: {
    email: emailMessageModule,
    whatsup: whatsupMessageModule
  },
  permission: require('./permission'),
  get: getWithAuthors,
  getModel: getModel,
  getInstance: getInstance,
  addNewComment: addNewComment,
  findByIds: findByIds
};
