'use strict';

var injections = {};

function addLessInjection(moduleName, files, innerApps) {
  injections[moduleName] = injections[moduleName] || {};
  innerApps.forEach(function(innerApp) {
    injections[moduleName][innerApp] = injections[moduleName][innerApp] || {};
    injections[moduleName][innerApp].less = injections[moduleName][innerApp].less ||  [];
    injections[moduleName][innerApp].less = injections[moduleName][innerApp].less.concat(files);
  });
}

function getInjections() {
  return injections;
}

module.exports.addLessInjection = addLessInjection;
module.exports.getInjections = getInjections;
