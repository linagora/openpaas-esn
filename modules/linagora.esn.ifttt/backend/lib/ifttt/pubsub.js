'use strict';

const request = require('request'),
      constants = require('./constants'),
      uuid = require('node-uuid');

module.exports = dependencies => {
  const pubsub = dependencies('pubsub'),
        calendarConstants = dependencies('calendar').constants;
        //chatConstants = dependencies('chat').constants;

  return {
    start
  };

  /////

  function start() {
    pubsub.local.topic(calendarConstants.NOTIFICATIONS.EVENT_ADDED).subscribe(calendarEventAddTrigger);
    //pubsub.global.topic(chatConstants.NOTIFICATIONS.USERS_MENTION).subscribe(chatUserMentionTrigger);
  }

  function calendarEventAddTrigger(data) {
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

  function chatUserMentionTrigger(data) {
    //data : {message: data.message, for: mention}
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
