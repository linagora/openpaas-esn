'use strict';

var mongoose = require('mongoose');
var DEFAULT_LIMIT = 50;
var DEFAULT_OFFSET = 0;


var collaborationModels = {
  community: 'Community'
};

function getModel(objectType) {
  var modelName = collaborationModels[objectType];
  if (!modelName) {
    return;
  }
  var Model = mongoose.model(modelName);
  return Model;
}

function isMember(collaboration, userId, callback) {
  if (!collaboration || !collaboration._id) {
    return callback(new Error('Collaboration object is required'));
  }

  var isInMembersArray = collaboration.members.some(function(m) {
    return m.member.objectType === 'user' && m.member.id.equals(userId);
  });
  return callback(null, isInMembersArray);
}

function getMembershipRequests(objectType, objetId, query, callback) {
  query = query || {};

  var Model = getModel(objectType);
  if (!Model) {
    return callback(new Error('Collaboration model ' + objectType + ' is unknown'));
  }

  var q = Model.findById(objetId);
  q.slice('membershipRequests', [query.offset || DEFAULT_OFFSET, query.limit || DEFAULT_LIMIT]);
  q.populate('membershipRequests.user');
  q.exec(function(err, community) {
    if (err) {
      return callback(err);
    }
    return callback(null, community ? community.membershipRequests : []);
  });
}

function getMembershipRequest(collaboration, user) {
  if (!collaboration.membershipRequests) {
    return false;
  }
  var mr = collaboration.membershipRequests.filter(function(mr) {
    return mr.user.equals(user._id);
  });
  return mr.pop();
}


function query(objectType, q, callback) {
  q = q || {};

  var Model = getModel(objectType);
  if (!Model) {
    return callback(new Error('Collaboration model ' + objectType + ' is unknown'));
  }
  return Model.find(q, callback);
}

function queryOne(objectType, q, callback) {
  q = q || {};

  var Model = getModel(objectType);
  if (!Model) {
    return callback(new Error('Collaboration model ' + objectType + ' is unknown'));
  }
  return Model.findOne(q, callback);
}

function registerCollaborationModel(name, modelName, schema) {
  if (collaborationModels[name]) {
    throw new Error('Collaboration model ' + name + 'is already registered');
  }
  var model = mongoose.model(modelName, schema);
  collaborationModels[name] = modelName;
  return model;
}

module.exports.query = query;
module.exports.queryOne = queryOne;
module.exports.schemaBuilder = require('../db/mongo/models/base-collaboration');
module.exports.registerCollaborationModel = registerCollaborationModel;
module.exports.getMembershipRequests = getMembershipRequests;
module.exports.getMembershipRequest = getMembershipRequest;
module.exports.isMember = isMember;
