'use strict';

// The message weight will be ordered based on these ordered rules:
//
// 1. Unread thread with no responses
// 2. Unread message in a thread
//
// Then order them by date

function findFirstUnread(responses) {
  var unreads = responses.filter(function(response) {
    return !response.read;
  });
  return unreads.length > 0 ? unreads[0] : undefined;
}

function computeMessagesWeight(messages) {

  messages.forEach(function(message) {
    message.compute = {};

    if (!message.read && message.responses.length === 0) {
      message.compute.top = true;
      message.compute.weightDate = message.published;
    }

    if (message.read && message.responses.length > 0) {
      var first = findFirstUnread(message.responses);
      if (first) {
        message.compute.top = false;
        message.compute.weightDate = first.published;
      }
    }
  });

  messages.sort(function(a, b) {
    var computeA = a.compute;
    var computeB = b.compute;

    if (computeA.top && computeB.top) {
      if (computeA.weightDate > computeB.weightDate) {
        return 1;
      }

      if (computeB.weightDate > computeA.weightDate) {
        return -1;
      }

      return 0;
    }

    if (computeA.top && !computeB.top) {
      return 1;
    }

    if (!computeA.top && computeB.top) {
      return -1;
    }

    if (!computeA.top && !computeB.top) {
      if (computeA.weightDate > computeB.weightDate) {
        return 1;
      }

      if (computeB.weightDate > computeA.weightDate) {
        return -1;
      }
      return 0;
    }

    return 0;
  });

  for (var i = 0; i < messages.length; i++) {
    var message = messages[i];
    message.weight = i;
    delete message.compute;
  }

  return messages;
}
module.exports.computeMessagesWeight = computeMessagesWeight;
