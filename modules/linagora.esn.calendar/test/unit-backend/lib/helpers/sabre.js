'use strict';

const expect = require('chai').expect;

describe('sabreHelper', function() {

  beforeEach(function() {
    this.calendarModulePath = this.moduleHelpers.modulesPath + 'linagora.esn.calendar';
    this.sabreHelper = require(this.calendarModulePath + '/backend/lib/helpers/sabre');
  });

  describe('parseEventPath fn', function() {
    beforeEach(function() {
      this.eventPath = this.sabreHelper.parseEventPath('/calendars/USER/CAL_ID/EVENT_UID.ics');
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

    it('should get the eventUiid', function() {
      expect(this.eventPath.eventUiid).to.equal('EVENT_UID');
    });

    it('should return the eventUiid if the path has no suffix', function() {
      const eventPathWithoutSuffix = this.sabreHelper.parseEventPath('/calendars/USER/CAL_ID/EVENT_UID');

      expect(eventPathWithoutSuffix.eventUiid).to.equal('EVENT_UID');
    });
  });
});
