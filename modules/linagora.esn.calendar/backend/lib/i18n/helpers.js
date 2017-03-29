'use strict';

const Q = require('q');

module.exports = dependencies => {
  const esnConfig = dependencies('esn-config');

  return {
    getLocaleForSystem,
    getLocaleForUser
  };

  function getLocaleForUser(user) {
    return Q.ninvoke(esnConfig('locale').inModule('core').forUser(user), 'get');
  }

  function getLocaleForSystem() {
    return Q.ninvoke(esnConfig('locale').inModule('core'), 'get');
  }
};
