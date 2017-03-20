'use strict';

let esnConfig;
const q = require('q');

function getLocaleForUser(user) {
  return esnConfig('locale').inModule('core').forUser(user).get();
}

function getLocaleForSystem() {
  return esnConfig('locale').inModule('core').get();
}

module.exports = function(dependencies) {
  esnConfig = dependencies('esn-config');
  return {
    getLocaleForUser,
    getLocaleForSystem
  };
};
