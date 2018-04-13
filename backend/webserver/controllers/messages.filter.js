const activitystreamModule = require('../../core/activitystreams');

module.exports = {
  filterMessageFromActivityStream,
  filterMessagesFromActivityStream
};

function filterMessagesFromActivityStream(messages, activitystream) {
  return Promise.all(messages.map(message => filterMessageFromActivityStream(message, activitystream))).then(messages => messages.filter(message => !!message));
}

function filterMessageFromActivityStream(message, activitystream) {
  // FIXME: For now we say that the stream is the first of the shares array...
  // This needs to change and needs more work:
  // - The API must not be GET /messages?ids[] but GET /activitystreams/:uuid/messages?ids[]
  // - The frontend code must be changed to send query to the right endpoint (good luck)
  // - This MUST be done when message sharing is back
  if (!message) {
    return;
  }

  activitystream = activitystream || message.shares[0];
  if (!activitystream) {
    return;
  }

  return new Promise(resolve => {
    activitystreamModule.getTimelineEntryFromStreamMessage(
      { uuid: activitystream.id },
      message,
      (err, timeline) => resolve(!err && timeline && timeline.verb !== 'delete' ? message : undefined)
    );
  })
  .then(message => {
    if (message && message.responses && message.responses.length) {
      return filterMessagesFromActivityStream(message.responses, activitystream).then(responses => {
        message.responses = responses;

        return message;
      });
    }

    return message;
  });
}
