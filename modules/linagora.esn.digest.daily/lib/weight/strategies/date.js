'use strict';

// The message weight will be ordered based on these ordered rules:
//
// 1. Unread thread with no responses
// 2. Unread message in a thread
//
// Then order them by date

module.exports = function(dependencies) {

  var arrayHelper = dependencies('helpers').array;

  function findFirstUnread(responses) {
    var unreads = responses.filter(function(response) {
      return !response.read;
    });
    return unreads.length > 0 ? unreads[0] : undefined;
  }

  function computeMessagesWeight(messages) {

    function compareWeightDate(a, b) {
      return (a > b) - (b > a);
    }

    function compareCompute(a, b) {
      var computeA = a.compute;
      var computeB = b.compute;

      if (computeA.top && computeB.top) {
        // when both are root messages, compare on their date
        return compareWeightDate(computeA.weightDate, computeB.weightDate);
      }

      if (computeA.root && !computeB.root) {
        // when A is root message and not B, A has more weight
        return 1;
      }

      if (!computeA.root && computeB.root) {
        // when B is root message and not A, B has more weight
        return -1;
      }

      if (!computeA.root && !computeB.root) {
        // when A and B are not root messages, compare the date of the responses
        return compareWeightDate(computeA.weightDate, computeB.weightDate);
      }

      return 0;
    }

    messages.forEach(function(message) {
      message.compute = {};

      if (!message.read && arrayHelper.isNullOrEmpty(message.responses)) {
        message.compute.root = true;
        message.compute.weightDate = message.published;
      }

      if (message.read && !arrayHelper.isNullOrEmpty(message.responses)) {
        var first = findFirstUnread(message.responses);
        if (first) {
          message.compute.root = false;
          message.compute.weightDate = first.published;
        }
      }
    });

    messages.sort(compareCompute);

    messages.forEach(function(message, i) {
      message.weight = i;
      delete message.compute;
    });

    return messages;
  }

  return {
    computeMessagesWeight: computeMessagesWeight
  };
};

