'use strict';

// The message weight will be ordered based on these ordered rules:
//
// 1. Unread thread with no responses
// 2. Unread message in a thread
//
// Then order them by date

module.exports = function(dependencies) {

  var arrayHelper = dependencies('helpers').array;

  function getLastResponse(message) {
    if (arrayHelper.isNullOrEmpty(message.responses)) {
      return message;
    }
    return message.responses[message.responses.length - 1];
  }

  function computeMessagesWeight(messages) {

    function compareWeightDate(a, b) {
      return (a > b) - (b > a);
    }

    function compareCompute(a, b) {

      if (a.read && !b.read) {
        // when A is read and B is NOT read, B has more weight
        return -1;
      }

      if (!a.read && b.read) {
        // when A is NOT read and B is read, A has more weight
        return 1;
      }

      // when both are read OR both are not read, compare on their last response date
      return compareWeightDate(getLastResponse(a).published, getLastResponse(b).published);
    }

    messages.sort(compareCompute);

    messages.forEach(function(message, i) {
      message.weight = i;
    });

    return messages;
  }

  return {
    computeMessagesWeight: computeMessagesWeight
  };
};

