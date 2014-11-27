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


  lib.query = query;
  return lib;
}

module.exports = projectLib;
