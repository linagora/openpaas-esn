'use strict';

const mongoose = require('mongoose');
const async = require('async');
const tupleModule = require('../tuple');
const memberResolver = require('./member/resolver');

const member = require('./member')({isCollaboration, getModel, getLib, queryOne});
const permission = require('./permission')(member);
const usernotification = require('./usernotification')({member});

const collaborationModels = {};
const collaborationLibs = {};

module.exports = {
  addObjectType,
  CONSTANTS: require('./constants'),
  findCollaborationFromActivityStreamID,
  getCollaborationsForTuple,
  getCollaborationsForUser,
  getLib,
  getModel,
  getStreamsForUser,
  hasDomain,
  isCollaboration,
  member,
  permission,
  query,
  queryOne,
  registerCollaborationLib,
  registerCollaborationModel,
  schemaBuilder: require('../db/mongo/models/base-collaboration'),
  usernotification,
  userToMember,
  memberResolver
};

function addObjectType(objectType, collaborations) {
  return collaborations.map(collaboration => {
    if (typeof collaboration.toObject === 'function') {
      collaboration = collaboration.toObject();
    }
    collaboration.objectType = objectType;

    return collaboration;
  });
}

function findCollaborationFromActivityStreamID(id, callback) {
  const finders = [];

  function finder(type, callback) {
    queryOne(type, {'activity_stream.uuid': id}, (err, result) => {
      if (err || !result) {
        return callback();
      }

      callback(null, result);
    });
  }

  Object.keys(collaborationModels).forEach(function(key) {
    finders.push(async.apply(finder, key));
  });

  async.parallel(finders, (err, results) => {
    if (err) {
      return callback(err);
    }

    async.filter(results, (item, callback) => callback(null, !!item), callback);
  });
}

function getCollaborationsForTuple(tuple, callback) {
  if (!tuple) {
    return callback(new Error('Tuple is required'));
  }

  tuple = tupleModule.get(tuple.objectType, tuple.id);
  if (!tuple) {
    return callback(new Error('Can not create tuple'));
  }

  const finders = [];

  function finder(type, callback) {
    query(type, {members: {$elemMatch: { 'member.objectType': tuple.objectType, 'member.id': tuple.id}}}, (err, result) => {
      if (err || !result) {
        return callback();
      }

      callback(null, addObjectType(type, result));
    });
  }

  Object.keys(collaborationModels).forEach(function(key) {
    finders.push(async.apply(finder, key));
  });

  async.parallel(finders, (err, results) => {
    if (err) {
      return callback(err);
    }

    results = results.reduce((a, b) => a.concat(b));
    callback(null, results);
  });
}

function getCollaborationsForUser(userId, options, callback) {
  const finders = [];
  let results = [];

  function finder(type, callback) {
    collaborationLibs[type].getCollaborationsForUser(userId, options, (err, collaborations) => {
      if (err) {
        return callback(err);
      }

      if (collaborations && collaborations.length) {
        results = results.concat(collaborations);
      }

      callback();
    });
  }

  Object.keys(collaborationLibs).forEach(type => {
    if (collaborationLibs[type] && collaborationLibs[type].getCollaborationsForUser) {
      finders.push(async.apply(finder, type));
    }
  });

  async.parallel(finders, err => callback(err, results));
}

function getLib(objectType) {
  return collaborationLibs[objectType] || null;
}

function getModel(objectType) {
  const modelName = collaborationModels[objectType];

  if (!modelName) {
    return;
  }

  return mongoose.model(modelName);
}

function getStreamsForUser(userId, options, callback) {
  const finders = [];
  let results = [];

  function finder(type, callback) {
    collaborationLibs[type].getStreamsForUser(userId, options, (err, streams) => {
      if (err || !streams || !streams.length) {
        return callback();
      }

      results = results.concat(streams);
      callback(null, null);
    });
  }

  Object.keys(collaborationLibs).forEach(type => {
    if (collaborationLibs[type] && collaborationLibs[type].getStreamsForUser) {
      finders.push(async.apply(finder, type));
    }
  });

  async.parallel(finders, err => {
    if (err) {
      return callback(err);
    }
    callback(null, results);
  });
}

function hasDomain(collaboration, domainId) {
  if (!collaboration || !collaboration.domain_ids) {
    return false;
  }

  return collaboration.domain_ids.some(id => String(id) === String(domainId));
}

function isCollaboration(tuple) {
  return !!collaborationModels[tuple.objectType];
}

function query(objectType, q = {}, callback) {
  const Model = getModel(objectType);

  if (!Model) {
    return callback(new Error(`Collaboration model ${objectType} is unknown`));
  }

  return Model.find(q, callback);
}

function queryOne(objectType, q = {}, callback) {
  const Model = getModel(objectType);

  if (!Model) {
    return callback(new Error(`Collaboration model ${objectType} is unknown`));
  }

  return Model.findOne(q, callback);
}

function registerCollaborationLib(name, lib) {
  if (collaborationLibs[name]) {
    throw new Error(`Collaboration lib for ${name} is already registered`);
  }
  collaborationLibs[name] = lib;
}

function registerCollaborationModel(name, modelName, schema) {
  if (collaborationModels[name]) {
    throw new Error(`Collaboration model ${name} is already registered`);
  }

  const model = mongoose.model(modelName, schema);

  collaborationModels[name] = modelName;

  return model;
}

function userToMember(document) {
  const result = {};

  if (!document || !document.member) {
    return result;
  }

  if (typeof document.member.toObject === 'function') {
    result.user = document.member.toObject();
  } else {
    result.user = document.member;
  }

  delete result.user.password;
  delete result.user.avatars;
  delete result.user.login;

  result.metadata = {
    timestamps: document.timestamps
  };

  return result;
}
