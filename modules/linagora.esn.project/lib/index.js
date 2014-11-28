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


  lib.query = query;
  lib.getMembershipRequests = getMembershipRequests;
  lib.getMembershipRequest = getMembershipRequest;
  lib.isMember = isMember;
  return lib;
}

module.exports = projectLib;
