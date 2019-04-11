'use strict';

module.exports = function(dependencies) {
  const moduleName = 'linagora.esn.calendar';

  return require('./router')(dependencies, moduleName);
};
