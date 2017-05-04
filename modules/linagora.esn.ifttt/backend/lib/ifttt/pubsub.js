'use strict';

const request = require('request'),
      constants = require('./constants'),
      uuid = require('node-uuid');

module.exports = dependencies => {
  const pubsub = dependencies('pubsub'),
        calendarConstants = dependencies('calendar').constants;

  return {
    start
  };

  /////

  function start() {
    pubsub.local.topic(calendarConstants.NOTIFICATIONS.EVENT_ADDED).subscribe(trigger);
  }

  function trigger(data) {
    request({
      url: constants.IFTTT_REALTIME.URL,
      method: 'POST',
      headers: {
        [constants.IFTTT_REALTIME.HEADERS.CHANNEL_KEY]: constants.SERVICE_KEY,
        [constants.IFTTT_REALTIME.HEADERS.REQUEST_ID]: uuid.v4()
      },
      json: true,
      body: {
        data: [{ user_id: data.userId }]
      }
    });
  }
};
