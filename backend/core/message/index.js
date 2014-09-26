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
  addNewComment: addNewComment
};
