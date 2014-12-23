'use strict';

//
// Mail sender rules.
//
// Send the message to all the collaboration members even the message creator.
//

module.exports = function(collaboration, message, callback) {
  return callback(null, collaboration.members);
};
