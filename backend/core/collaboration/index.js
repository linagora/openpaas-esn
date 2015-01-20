'use strict';

var mongoose = require('mongoose');
var User = mongoose.model('User');
var async = require('async');
var permission = require('./permission');
var localpubsub = require('../pubsub').local;
var globalpubsub = require('../pubsub').global;

var WORKFLOW_NOTIFICATIONS_TOPIC = {
  request: 'collaboration:membership:request',
  invitation: 'collaboration:membership:invite'
};
module.exports.WORKFLOW_NOTIFICATIONS_TOPIC = WORKFLOW_NOTIFICATIONS_TOPIC;

var MEMBERSHIP_TYPE_REQUEST = 'request';
var MEMBERSHIP_TYPE_INVITATION = 'invitation';
module.exports.MEMBERSHIP_TYPE_REQUEST = MEMBERSHIP_TYPE_REQUEST;
module.exports.MEMBERSHIP_TYPE_INVITATION = MEMBERSHIP_TYPE_INVITATION;

var DEFAULT_LIMIT = 50;
var DEFAULT_OFFSET = 0;

var collaborationModels = {
  community: 'Community'
};

var collaborationLibs = {
  community: require('../community')
};

function getModel(objectType) {
  var modelName = collaborationModels[objectType];
  if (!modelName) {
    return;
  }
  var Model = mongoose.model(modelName);
  return Model;
}

function getLib(objectType) {
  return collaborationLibs[objectType] || null;
}

function isManager(objectType, collaboration, user, callback) {
  var id = collaboration._id || collaboration;
  var user_id = user._id || user;

  var Model = getModel(objectType);
  if (!Model) {
    return callback(new Error('Collaboration model ' + objectType + ' is unknown'));
  }

  Model.findOne({_id: id, 'creator': user_id}, function(err, result) {
    if (err) {
      return callback(err);
    }
    return callback(null, !!result);
  });
}

function isMember(collaboration, tuple, callback) {
  if (!collaboration || !collaboration._id) {
    return callback(new Error('Collaboration object is required'));
  }

  var isInMembersArray = collaboration.members.some(function(m) {
    return m.member.objectType === tuple.objectType && m.member.id + '' === tuple.id + '';
  });
  return callback(null, isInMembersArray);
}

function getManagers(objectType, collaboration, query, callback) {
  var id = collaboration._id || collaboration;

  var Model = getModel(objectType);
  if (!Model) {
    return callback(new Error('Collaboration model ' + objectType + ' is unknown'));
  }

  var q = Model.findById(id);
  // TODO Right now creator is the only manager. It will change in the futur.
  // query = query ||  {};
  // q.slice('managers', [query.offset || DEFAULT_OFFSET, query.limit || DEFAULT_LIMIT]);
  q.populate('creator');
  q.exec(function(err, collaboration) {
    if (err) {
      return callback(err);
    }
    return callback(null, collaboration ? [collaboration.creator] : []);
  });
}

function getMembers(collaboration, objectType, query, callback) {
  query = query ||  {};

  var id = collaboration._id || collaboration;

  var Model = getModel(objectType);
  if (!Model) {
    return callback(new Error('Collaboration model ' + collaboration.objectType + ' is unknown'));
  }

  Model.findById(id, function(err, collaboration) {
    if (err) {
      return callback(err);
    }

    var offset = query.offset || DEFAULT_OFFSET;
    var limit = query.limit || DEFAULT_LIMIT;
    var members = collaboration.members.slice(offset, offset + limit);
    var memberIds = members.map(function(member) { return member.member.id; });

    User.find({_id: {$in: memberIds}}, function(err, users) {
      if (err) {
        return callback(err);
      }

      var hash = {};
      users.forEach(function(u) { hash[u._id] = u; });
      members.forEach(function(m) {
        m.member = hash[m.member.id];
      });

      return callback(null, members);
    });
  });
}

function addMembershipRequest(objectType, collaboration, userAuthor, userTarget, workflow, actor, callback) {
  if (!userAuthor) {
    return callback(new Error('Author user object is required'));
  }
  var userAuthorId = userAuthor._id || userAuthor;

  if (!userTarget) {
    return callback(new Error('Target user object is required'));
  }
  var userTargetId = userTarget._id || userTarget;

  if (!collaboration) {
    return callback(new Error('Collaboration object is required'));
  }

  if (!workflow) {
    return callback(new Error('Workflow string is required'));
  }

  var topic = WORKFLOW_NOTIFICATIONS_TOPIC[workflow];
  if (!topic) {
    var errorMessage = 'Invalid workflow, must be ';
    var isFirstLoop = true;
    for (var key in WORKFLOW_NOTIFICATIONS_TOPIC) {
      if (WORKFLOW_NOTIFICATIONS_TOPIC.hasOwnProperty(key)) {
        if (isFirstLoop) {
          errorMessage += '"' + key + '"';
          isFirstLoop = false;
        } else {
          errorMessage += ' or "' + key + '"';
        }
      }
    }
    return callback(new Error(errorMessage));
  }

  if (workflow !== 'invitation' && !permission.supportsMemberShipRequests(collaboration)) {
    return callback(new Error('Only Restricted and Private collaborations allow membership requests.'));
  }

  isMember(collaboration, {objectType: 'user', id: userTargetId}, function(err, isMember) {
    if (err) {
      return callback(err);
    }
    if (isMember) {
      return callback(new Error('User already member of the collaboration.'));
    }

    var previousRequests = collaboration.membershipRequests.filter(function(request) {
      var requestUserId = request.user._id || request.user;
      return requestUserId.equals(userTargetId);
    });
    if (previousRequests.length > 0) {
      return callback(null, collaboration);
    }

    collaboration.membershipRequests.push({user: userTargetId, workflow: workflow});

    collaboration.save(function(err, collaborationSaved) {
      if (err) {
        return callback(err);
      }

      localpubsub.topic(topic).forward(globalpubsub, {
        author: userAuthorId,
        target: userTargetId,
        collaboration: {objectType: objectType, id: collaboration._id},
        workflow: workflow,
        actor: actor || 'user'
      });

      return callback(null, collaborationSaved);
    });
  });
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
  q.exec(function(err, collaboration) {
    if (err) {
      return callback(err);
    }
    return callback(null, collaboration ? collaboration.membershipRequests : []);
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

function addMember(target, author, member, callback) {
  if (!target || !member) {
    return callback(new Error('Project and member are required'));
  }

  if (!target.save) {
    return callback(new Error('addMember(): first argument (target) must be a project mongoose model'));
  }

  if (!member.id || !member.objectType) {
    return callback(new Error('member must be {id, objectType}'));
  }

  var isMemberOf = target.members.filter(function(m) {
    return m.member.id.equals(member.id) && m.member.objectType === member.objectType;
  });

  if (isMemberOf.length) {
    return callback(null, target);
  }

  target.members.push({member: member, status: 'joined'});
  return target.save(function(err, update) {
    if (err) {
      return callback(err);
    }

    localpubsub.topic(target.objectType + ':member:add').forward(globalpubsub, {
      author: author,
      target: target,
      member: member
    });

    return callback(null, update);
  });
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

function registerCollaborationLib(name, lib) {
  if (collaborationLibs[name]) {
    throw new Error('Collaboration lib for ' + name + 'is already registered');
  }
  collaborationLibs[name] = lib;
}

function addObjectType(objectType, collaborations) {
  return collaborations.map(function(collaboration) {
    if (typeof(collaboration.toObject) === 'function') {
      collaboration = collaboration.toObject();
    }
    collaboration.objectType = objectType;
    return collaboration;
  });
}

function findCollaborationFromActivityStreamID(id, callback) {
  var finders = [];

  function finder(type, callback) {
    queryOne(type, {'activity_stream.uuid': id}, function(err, result) {
      if (err || !result) {
        return callback();
      }
      return callback(null, result);
    });
  }

  for (var key in collaborationModels) {
    finders.push(async.apply(finder, key));
  }

  async.parallel(finders, function(err, results) {
    if (err) {
      return callback(err);
    }
    async.filter(results, function(item, callback) {
      return callback(!!item);
    }, function(results) {
      return callback(null, results);
    });
  });
}

function getCollaborationsForTuple(tuple, callback) {

  if (!tuple) {
    return callback(new Error('Tuple is required'));
  }

  var finders = [];

  function finder(type, callback) {

    query(type, {
      members: {$elemMatch: { 'member.objectType': tuple.objectType, 'member.id': tuple.id}}
    }, function(err, result) {
      if (err || !result) {
        return callback();
      }
      return callback(null, addObjectType(type, result));
    });
  }

  for (var key in collaborationModels) {
    finders.push(async.apply(finder, key));
  }

  async.parallel(finders, function(err, results) {
    if (err) {
      return callback(err);
    }

    results = results.reduce(function(a, b) {
      return a.concat(b);
    });
    return callback(null, results);
  });
}

function getStreamsForUser(userId, options, callback) {
  var finders = [];
  var results = [];

  function finder(type, callback) {
    collaborationLibs[type].getStreamsForUser(userId, options, function(err, streams) {
      if (err || !streams || !streams.length) {
        return callback();
      }
      results = results.concat(streams);
      return callback(null, null);
    });
  }

  for (var type in collaborationLibs) {
    if (collaborationLibs[type] && collaborationLibs[type].getStreamsForUser) {
      finders.push(async.apply(finder, type));
    }
  }

  async.parallel(finders, function(err) {
    if (err) {
      return callback(err);
    }
    return callback(null, results);
  });
}

function hasDomain(collaboration) {
  if (!collaboration || !collaboration.domain_ids) {
    return false;
  }

  return collaboration.domain_ids.some(function(domainId) {
    return domainId + '' === domainId + '';
  });
}

function leave(objectType, collaboration, userAuthor, userTarget, callback) {
  var id = collaboration._id || collaboration;
  var userAuthor_id = userAuthor._id || userAuthor;
  var userTarget_id = userTarget._id || userTarget;
  var selection = { 'member.objectType': 'user', 'member.id': userTarget_id };
  var Model = getModel(objectType);
  Model.update(
    {_id: id, members: {$elemMatch: selection} },
    {$pull: {members: selection} },
    function(err, updated) {
      if (err) {
        return callback(err);
      }

      localpubsub.topic('collaboration:leave').forward(globalpubsub, {
        author: userAuthor_id,
        target: userTarget_id,
        collaboration: {objectType: objectType, id: id}
      });

      return callback(null, updated);
    }
  );
}

function join(objectType, collaboration, userAuthor, userTarget, actor, callback) {

  var id = collaboration._id || collaboration;
  var userAuthor_id = userAuthor._id || userAuthor;
  var userTarget_id = userTarget._id || userTarget;

  var member = {
    objectType: 'user',
    id: userTarget_id
  };

  addMember(collaboration, userAuthor, member, function(err, updated) {
    if (err) {
      return callback(err);
    }

    localpubsub.topic('collaboration:join').forward(globalpubsub, {
      author: userAuthor_id,
      target: userTarget_id,
      actor: actor || 'user',
      collaboration: {objectType: objectType, id: id}
    });

    return callback(null, updated);
  });
}

module.exports.getModel = getModel;
module.exports.getLib = getLib;
module.exports.getManagers = getManagers;
module.exports.getMembers = getMembers;
module.exports.query = query;
module.exports.queryOne = queryOne;
module.exports.schemaBuilder = require('../db/mongo/models/base-collaboration');
module.exports.registerCollaborationModel = registerCollaborationModel;
module.exports.registerCollaborationLib = registerCollaborationLib;
module.exports.addMembershipRequest = addMembershipRequest;
module.exports.getMembershipRequests = getMembershipRequests;
module.exports.getMembershipRequest = getMembershipRequest;
module.exports.isManager = isManager;
module.exports.isMember = isMember;
module.exports.addMember = addMember;
module.exports.getCollaborationsForTuple = getCollaborationsForTuple;
module.exports.findCollaborationFromActivityStreamID = findCollaborationFromActivityStreamID;
module.exports.getStreamsForUser = getStreamsForUser;
module.exports.permission = require('./permission');
module.exports.hasDomain = hasDomain;
module.exports.join = join;
module.exports.leave = leave;
