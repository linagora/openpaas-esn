'use strict';

var projectObjectType = 'project';

function createModels(dependencies) {
  var model = require('../backend/db/mongo/project')(dependencies('collaboration'));
  return {
    project: model
  };
}

function projectToStream(project) {
  return {
    uuid: project.activity_stream.uuid,
    target: {
      objectType: 'project',
      _id: project._id,
      displayName: project.title,
      id: 'urn:linagora.com:project:' + project._id,
      image: project.avatar || ''
    }
  };
}

function projectLib(dependencies) {
  var lib = {};
  var collaboration = dependencies('collaboration');
  var community = dependencies('community');

  lib.models = createModels(dependencies);

  function query(q, callback) {
    return collaboration.query(projectObjectType, q, callback);
  }
  function queryOne(q, callback) {
    return collaboration.queryOne(projectObjectType, q, callback);
  }

  function create(projectData, callback) {
    if (!projectData) {
      return callback(new Error('Cannot save null project'));
    }
    if (!projectData.title) {
      return callback(new Error('Project title is mandatory'));
    }
    if (!projectData.creator) {
      return callback(new Error('Project creator is mandatory'));
    }

    var project = new lib.models.project(projectData);
    project.save(callback);
  }

  function getMembershipRequests(project, query, callback) {
    var projectId = project._id || project;
    return collaboration.getMembershipRequests(projectObjectType, projectId, query, callback);
  }

  function getMembershipRequest(project, user) {
    return collaboration.getMembershipRequest(project, user);
  }

  function isMember(project, tuple, callback) {
    return collaboration.isMember(project, tuple, callback);
  }

  function isIndirectMember(project, tuple, callback) {
    return collaboration.isIndirectMember(project, tuple, callback);
  }

  function addMember(project, author, member, callback) {
    return collaboration.addMember(project, author, member, callback);
  }

  function getUserProjects(userId, options, callback) {
    if (!userId) {
      return callback(new Error('User is required'));
    }

    var done = function(err, result) {
      if (err) {
        return callback(err);
      }

      if (!result || result.length === 0) {
        return callback(null, []);
      }

      if (options.writable) {
        return collaboration.permission.filterWritable(result, {objectType: 'user', id: userId + ''}, callback);
      }
      return callback(null, result);
    };

    var params = {};
    if (options.member) {
      params.members = {'$elemMatch': { 'member.objectType': 'user', 'member.id': userId}};
    }

    var communityOptions = {};
    if (options.member) {
      communityOptions.member = true;
    }

    community.getUserCommunities(userId, communityOptions, function(err, communities) {
      var communityTuples = communities.map(function(community) {
        return { 'member.objectType': 'community', 'member.id': community._id};
      });

      if (communityTuples.length) {
        var or = [];
        communityTuples.forEach(function(communityTuple) {
          or.push({
            members: { '$elemMatch': communityTuple }
          });
        });
        or.push(params);
        params = {
          $or: or
        };
      }

      if (options.domainid) {
        params.domain_ids = options.domainid;
      }
      if (options.name) {
        params.title = options.name;
      }

      return query(params, done);
    });
  }

  function getStreamsForUser(userId, options, callback) {
    getUserProjects(userId, options, function(err, projects) {
      if (err) { return callback(err); }
      callback(null, projects.map(projectToStream));
    });
  }

  function getFromActivityStreamID(uuid, callback) {
    collaboration.queryOne(projectObjectType, {'activity_stream.uuid': uuid}, callback);
  }

  function updateAvatar(project, avatar, callback) {
    if (!project) {
      return callback(new Error('Project is required'));
    }
    if (!avatar) {
      return callback(new Error('Avatar ID is required'));
    }
    project.avatar = avatar;
    project.save(callback);
  }

  lib.query = query;
  lib.queryOne = queryOne;
  lib.create = create;
  lib.getMembershipRequests = getMembershipRequests;
  lib.getMembershipRequest = getMembershipRequest;
  lib.isMember = isMember;
  lib.isIndirectMember = isIndirectMember;
  lib.addMember = addMember;
  lib.getUserProjects = getUserProjects;
  lib.getCollaborationsForUser = getUserProjects;
  lib.getStreamsForUser = getStreamsForUser;
  lib.getFromActivityStreamID = getFromActivityStreamID;
  lib.updateAvatar = updateAvatar;
  return lib;
}

module.exports = projectLib;
