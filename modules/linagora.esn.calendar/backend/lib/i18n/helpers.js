'use strict';

let esnConfig;

function getLocaleForUser(user) {
  return q.ninvoke(esnConfig('locale').inModule('core').forUser(user), 'get');
}

module.exports = function(dependencies) {
  esnConfig = dependencies('esn-config');
  return {
    getLocaleForUser
  };
};
