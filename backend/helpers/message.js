'use strict';

module.exports.postToModelMessage = function(message, user) {
  var objectType = message.object.objectType,
      content = message.object.description,
      author = user._id,
      shares = message.targets;

  var result = {
    objectType: objectType,
    content: content,
    author: author,
    shares: shares
  };

  if (message.object.position) {
    result.position = message.object.position;
  }

  return result;
};
