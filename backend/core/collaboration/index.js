'use strict';

var mongoose = require('mongoose');
var async = require('async');
var permission = require('./permission');
var tupleModule = require('../tuple');
var localpubsub = require('../pubsub').local;
var globalpubsub = require('../pubsub').global;
var esnconfig = require('../esn-config');
var request = require('superagent');

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

var membersMapping = {
  user: 'User',
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
    return callback(err, !!result);
  });
}

function isManagerWithAaas(objectType, collaboration, user, callback) {
  var id = collaboration._id || collaboration;
  var user_id = user._id || user;

  esnconfig('aaas').get(function(err, data) {
    if (err) {
      return callback(err);
    }
    var aaasInfo = data || {};
    aaasInfo.host = aaasInfo.host || 'localhost';
    aaasInfo.port = aaasInfo.port || '8080';
    aaasInfo.endpoint = aaasInfo.endpoint || '/SaaS/resources/authz';

    request
      .get('http://' + aaasInfo.host + ':' + aaasInfo.port + aaasInfo.endpoint)
      .query({ resource: 'A' + id, subject: 'A' + user_id, action: 'GET' })
      .end(function(err, res) {
        if (err) {
          return callback(err);
        }
        if (res.notFound) {
          return isManager(objectType, collaboration, user, callback);
        }
        if (!res.ok) {
          return callback(new Error('Error when requesting the AaaS server, please read the AaaS server log'));
        }
        var aaasResult = (res.text === 'true');
        if (!aaasResult) {

          mongoose.connection.collection('loria').update({_id: user_id}, {$inc: {nb_deny: 1}}, {upsert: true}, function(err, result) {
            if (err) {
              return callback(err);
            }

            mongoose.connection.collection('loria').findOne({_id: user_id}, function(err, doc) {
              if (err) {
                return callback(err);
              }

              esnconfig('audit').get(function(err, data) {
                if (err) {
                  return callback(err);
                }

                var auditInfo = data || {};
                auditInfo.host = auditInfo.host || 'localhost';
                auditInfo.port = auditInfo.port || '8080';
                auditInfo.endpoint = auditInfo.endpoint || '/AuditService/resources/trustComputing';

                request
                  .get('http://' + auditInfo.host + ':' + auditInfo.port + auditInfo.endpoint)
                  .query({ subject: '' + user_id, nbDeny: doc.nb_deny + '', comSeverity: '0.01' })
                  .end(function(err, res) {
                    // Do nothing (it is the normal behavior)
                  });
              });
            });
          });

        }
        return callback(null, aaasResult);
      });
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
    return callback(err, collaboration ? [collaboration.creator] : []);
  });
}

function fetchMember(tuple, callback) {
  if (!tuple) {
    return callback(new Error('Member tuple is required'));
  }

  var schema = membersMapping[tuple.objectType];
  if (!schema) {
    return callback(new Error('No schema to fetch member for objectType ' + tuple.objectType));
  }

  var Model = mongoose.model(schema);
  return Model.findOne({_id: tuple.id}, callback);
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

    var members = collaboration.members;
    if (query.objectTypeFilter) {
      var operation;
      if (query.objectTypeFilter[0] === '!') {
        var objectTypeFilter = query.objectTypeFilter.substr(1);
        operation = function(m) { return m.member.objectType !== objectTypeFilter; };
      } else {
        operation = function(m) { return m.member.objectType === query.objectTypeFilter; };
      }

      members = members.filter(operation);
    }

    var total_count = members.length;

    members = members.slice(offset, offset + limit);

    async.map(members, function(m, callback) {
      return fetchMember(m.member, function(err, loaded) {
        m.objectType = m.member.objectType;
        m.id = m.member.id;

        if (loaded) {
          m.member = loaded;
        }
        return callback(null, m);
      });
    }, function(err, members) {
        members.total_count = total_count;
        callback(err, members);
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
    return (m.member.id.equals ? m.member.id.equals(member.id) : m.member.id === member.id) && m.member.objectType === member.objectType;
  });

  if (isMemberOf.length) {
    return callback(null, target);
  }

  member = tupleModule.get(member.objectType, member.id);
  if (!member) {
    return callback(new Error('Unsupported tuple'));
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

  tuple = tupleModule.get(tuple.objectType, tuple.id);
  if (!tuple) {
    return callback(new Error('Can not create tuple'));
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

module.exports.cleanMembershipRequest = function(collaboration, user, callback) {
  if (!user) {
    return callback(new Error('User author object is required'));
  }

  if (!collaboration) {
    return callback(new Error('Community object is required'));
  }

  var userId = user._id || user;


  var otherUserRequests = collaboration.membershipRequests.filter(function(request) {
    var requestUserId = request.user._id || request.user;
    return !requestUserId.equals(userId);
  });

  collaboration.membershipRequests = otherUserRequests;
  collaboration.save(callback);
};

module.exports.cancelMembershipInvitation = function(objectType, collaboration, membership, manager, onResponse) {
  this.cleanMembershipRequest(collaboration, membership.user, function(err) {
    if (err) { return onResponse(err); }
    localpubsub.topic('collaboration:membership:invitation:cancel').forward(globalpubsub, {
      author: manager._id,
      target: membership.user,
      membership: membership,
      collaboration: {objectType: objectType, id: collaboration._id}
    });
    onResponse(err, collaboration);
  });
};

module.exports.refuseMembershipRequest = function(objectType, collaboration, membership, manager, onResponse) {
  this.cleanMembershipRequest(collaboration, membership.user, function(err) {
    if (err) { return onResponse(err); }
    localpubsub.topic('collaboration:membership:request:refuse').forward(globalpubsub, {
      author: manager._id,
      target: membership.user,
      membership: membership,
      collaboration: {objectType: objectType, id: collaboration._id}
    });
    onResponse(err, collaboration);
  });
};

module.exports.declineMembershipInvitation = function(objectType, collaboration, membership, user, onResponse) {
  this.cleanMembershipRequest(collaboration, membership.user, function(err) {
    if (err) { return onResponse(err); }
    localpubsub.topic('collaboration:membership:invitation:decline').forward(globalpubsub, {
      author: user._id,
      target: collaboration._id,
      membership: membership,
      collaboration: {objectType: objectType, id: collaboration._id}
    });
    onResponse(err, collaboration);
  });
};

module.exports.cancelMembershipRequest = function(objectType, collaboration, membership, user, onResponse) {
  this.cleanMembershipRequest(collaboration, membership.user, function(err) {
    if (err) { return onResponse(err); }
    localpubsub.topic('collaboration:membership:request:cancel').forward(globalpubsub, {
      author: user._id,
      target: collaboration._id,
      membership: membership,
      collaboration: {objectType: objectType, id: collaboration._id}
    });
    onResponse(err, collaboration);
  });
};

function userToMember(document) {
  var result = {};
  if (!document || !document.member) {
    return result;
  }

  if (typeof(document.member.toObject) === 'function') {
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
module.exports.isManagerWithAaas = isManagerWithAaas;
module.exports.isMember = isMember;
module.exports.addMember = addMember;
module.exports.getCollaborationsForTuple = getCollaborationsForTuple;
module.exports.findCollaborationFromActivityStreamID = findCollaborationFromActivityStreamID;
module.exports.getStreamsForUser = getStreamsForUser;
module.exports.permission = require('./permission');
module.exports.hasDomain = hasDomain;
module.exports.join = join;
module.exports.leave = leave;
module.exports.userToMember = userToMember;
