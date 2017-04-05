'use strict';

const expect = require('chai').expect;

describe('The event helper', function() {

  beforeEach(function() {
    this.calendarModulePath = this.moduleHelpers.modulesPath + 'linagora.esn.calendar';
    this.eventHelper = require(this.calendarModulePath + '/backend/lib/helpers/event');
  });

  describe('parseEventPath fn', function() {
    beforeEach(function() {
      this.eventPath = this.eventHelper.parseEventPath('/calendars/USER/CAL_ID/EVENT_UID.ics');
    });

    it('should get the path', function() {
      expect(this.eventPath.path).to.equal('/calendars/USER/CAL_ID/EVENT_UID.ics');
    });

    it('should get the userId', function() {
      expect(this.eventPath.userId).to.equal('USER');
    });

    it('should get the calendarId', function() {
      expect(this.eventPath.calendarId).to.equal('CAL_ID');
    });

    it('should get the eventUid', function() {
      expect(this.eventPath.eventUid).to.equal('EVENT_UID');
    });

    it('should return the eventUid if the path has no suffix', function() {
      const eventPathWithoutSuffix = this.eventHelper.parseEventPath('/calendars/USER/CAL_ID/EVENT_UID');

      expect(eventPathWithoutSuffix.eventUid).to.equal('EVENT_UID');
    });
  });
});
