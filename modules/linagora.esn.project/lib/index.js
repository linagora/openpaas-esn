'use strict';



function createModels(dependencies) {
  var model = require('../backend/db/mongo/project')(dependencies('collaboration'));
  return {
    project: model
  };
}

function projectLib(dependencies) {
  var lib = {};
  lib.models = createModels(dependencies);
  return lib;
}

module.exports = projectLib;
