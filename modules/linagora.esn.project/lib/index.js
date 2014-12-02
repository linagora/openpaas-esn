'use strict';

var projectObjectType = 'project';

function createModels(dependencies) {
  var model = require('../backend/db/mongo/project')(dependencies('collaboration'));
  return {
    project: model
  };
}

function projectLib(dependencies) {
  var lib = {};
  var collaboration = dependencies('collaboration');

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

  function isMember(project, userId, callback) {
    return collaboration.isMember(project, userId, callback);
  }

  function addMember(project, author, member, callback) {
    return collaboration.addMember(project, author, member, callback);
  }


  lib.query = query;
  lib.queryOne = queryOne;
  lib.create = create;
  lib.getMembershipRequests = getMembershipRequests;
  lib.getMembershipRequest = getMembershipRequest;
  lib.isMember = isMember;
  lib.addMember = addMember;
  return lib;
}

module.exports = projectLib;
