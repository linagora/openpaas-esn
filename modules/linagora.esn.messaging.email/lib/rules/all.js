'use strict';

//
// Mail sender rules.
//
// Send the message to all the collaboration members even the message creator.
//

module.exports = function(lib, dependencies) {
  return function all(collaboration, message, options, callback) {
    return callback(null, collaboration.members);
  };
};
