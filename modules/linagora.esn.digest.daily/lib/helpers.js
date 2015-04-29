'use strict';

function getMostRecentMessage(messages, message) {
  if (!messages) {
    return message;
  }

  var result = message;
  messages.forEach(function(m) {
    if (!result) {
      result = m;
    }

    if (result && (m.published >= result.published)) {
      result = m;
    }

    if (m.responses && m.responses.length > 0) {
      var response = getMostRecentMessage(m.responses, result);
      if (response && response.published >= result.published) {
        result = response;
      }
    }
  });
  return result;
}
module.exports.getMostRecentMessage = getMostRecentMessage;
