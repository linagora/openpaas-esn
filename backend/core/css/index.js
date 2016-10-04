'use strict';

var injections = {};

function sortByPriority(a, b) {
  return b.priority - a.priority;
}

function ensureLessObjects(files) {
  var desc = files.map(function(file) {
    return {
      filename: file.filename || file,
      priority: file.priority || 0
    };
  });
  return desc;
}

function orderLessFiles(files) {
  files.sort(sortByPriority);
}

function addLessInjection(moduleName, files, innerApps) {
  injections[moduleName] = injections[moduleName] || {};
  innerApps.forEach(function(innerApp) {
    injections[moduleName][innerApp] = injections[moduleName][innerApp] || {};
    injections[moduleName][innerApp].less = injections[moduleName][innerApp].less || [];
    injections[moduleName][innerApp].less = injections[moduleName][innerApp].less.concat(ensureLessObjects(files));
    orderLessFiles(injections[moduleName][innerApp].less);
  });
}

function getInjections() {
  return injections;
}

module.exports.addLessInjection = addLessInjection;
module.exports.getInjections = getInjections;
