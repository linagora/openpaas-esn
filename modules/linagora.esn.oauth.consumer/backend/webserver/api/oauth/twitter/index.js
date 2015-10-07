'use strict';

module.exports = function(router, dependencies) {
  return require('./routes')(router, dependencies);
};
