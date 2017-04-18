'use strict';

const expect = require('chai').expect;
const fs = require('fs');
const ICAL = require('ical.js');
const CONSTANTS = require('../../../../backend/lib/constants');

describe('The calendar search pubsub module', function() {
  let jcal, ics, logger, pubsub, globalpubsub, localpubsub;

  beforeEach(function() {
    this.moduleHelpers.backendPath = this.moduleHelpers.modulesPath + 'linagora.esn.calendar/backend';
    logger = {
      error: function() {},
      debug: function() {},
      info: function() {},
      warning: function() {}
    };

    globalpubsub = {};
    localpubsub = {};

    this.moduleHelpers.addDep('logger', logger);
    this.moduleHelpers.addDep('pubsub', pubsub);
    this.moduleHelpers.addDep('pubsub', this.helpers.mock.pubsub('', localpubsub, globalpubsub));

    ics = fs.readFileSync(__dirname + '/../../fixtures/meeting.ics', 'utf-8');
    jcal = new ICAL.Component.fromString(ics).jCal;
    ics = new ICAL.Component.fromString(ics).toString();
  });

  describe('On global pubsub events', function() {
    let self;

    beforeEach(function() {
      self = this;
    });

    function testLocalPublishOnEvent(event, localTopic) {
      const eventId = 'eventId';
      const calendarId = 'events';
      const userId = 'userId';
      const path = `/calendar/${userId}/${calendarId}/${eventId}.ics`;

      require(self.moduleHelpers.backendPath + '/lib/search/pubsub')(self.moduleHelpers.dependencies).listen();
      const handler = globalpubsub.topics[event].handler;

      handler({
        websocketEvent: event,
        event: jcal,
        eventPath: path
      });

      expect(localpubsub.topics[localTopic].data[0]).to.deep.equals({
        ics,
        path,
        userId,
        calendarId,
        eventUid: 'eventId'
      });
    }

    function testLocalPublishOnEventWithEmptyEvent(event, localTopic) {
      const eventId = 'eventId';
      const calendarId = 'events';
      const userId = 'userId';
      const path = `/calendar/${userId}/${calendarId}/${eventId}.ics`;

      require(self.moduleHelpers.backendPath + '/lib/search/pubsub')(self.moduleHelpers.dependencies).listen();
      const handler = globalpubsub.topics[event].handler;

      handler({
        websocketEvent: event,
        eventPath: path
      });

      expect(localpubsub.topics[localTopic].data[0]).to.deep.equals({
        path,
        userId,
        calendarId,
        eventUid: 'eventId'
      });
    }

    it('should push event creation on NOTIFICATIONS.EVENT_ADDED', function() {
      testLocalPublishOnEvent(CONSTANTS.EVENTS.EVENT.CREATED, CONSTANTS.NOTIFICATIONS.EVENT_ADDED);
    });

    it('should push event creation on NOTIFICATIONS.EVENT_REQUEST', function() {
      testLocalPublishOnEvent(CONSTANTS.EVENTS.EVENT.REQUEST, CONSTANTS.NOTIFICATIONS.EVENT_ADDED);
    });

    it('should push event creation on NOTIFICATIONS.EVENT_UPDATED', function() {
      testLocalPublishOnEvent(CONSTANTS.EVENTS.EVENT.UPDATED, CONSTANTS.NOTIFICATIONS.EVENT_UPDATED);
    });

    it('should push event creation on NOTIFICATIONS.EVENT_REPLY', function() {
      testLocalPublishOnEvent(CONSTANTS.EVENTS.EVENT.REPLY, CONSTANTS.NOTIFICATIONS.EVENT_UPDATED);
    });

    it('should push event creation on NOTIFICATIONS.EVENT_DELETED', function() {
      testLocalPublishOnEvent(CONSTANTS.EVENTS.EVENT.DELETED, CONSTANTS.NOTIFICATIONS.EVENT_DELETED);
    });

    it('should push event creation on NOTIFICATIONS.EVENT_DELETED with empty calendar event', function() {
      testLocalPublishOnEventWithEmptyEvent(CONSTANTS.EVENTS.EVENT.DELETED, CONSTANTS.NOTIFICATIONS.EVENT_DELETED);
    });

    it('should push event creation on NOTIFICATIONS.EVENT_CANCEL', function() {
      testLocalPublishOnEvent(CONSTANTS.EVENTS.EVENT.CANCEL, CONSTANTS.NOTIFICATIONS.EVENT_DELETED);
    });

    it('should push event creation on NOTIFICATIONS.EVENT_CANCEL with empty calendar event', function() {
      testLocalPublishOnEventWithEmptyEvent(CONSTANTS.EVENTS.EVENT.CANCEL, CONSTANTS.NOTIFICATIONS.EVENT_DELETED);
    });
  });
});
