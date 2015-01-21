'use strict';

module.exports = function(lib, dependencies) {

  return {
    whatsup: require('./whatsup')(lib, dependencies),
    organizational: require('./organizational')(lib, dependencies)
  };
};
