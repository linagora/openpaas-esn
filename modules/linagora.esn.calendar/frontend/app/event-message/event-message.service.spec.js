'use strict';

/*global chai:false*/

var expect = chai.expect;

describe('The cal-event-message Angular module directives', function() {

  var self = this;

  beforeEach(function() {
    angular.mock.module('esn.calendar', 'linagora.esn.graceperiod', 'jadeTemplates');
  });

  describe('The event message service', function() {
    beforeEach(angular.mock.inject(function(calEventMessageService) {
      self.calEventMessageService = calEventMessageService;
    }));

    it('should not fail for empty and null attendee', function() {
      [null, [], undefined].forEach(function(nullAttendees) {
        expect(self.calEventMessageService.computeAttendeeStats(nullAttendees)).to.deep.equal({
          'NEEDS-ACTION': 0,
          ACCEPTED: 0,
          TENTATIVE: 0,
          DECLINED: 0,
          OTHER: 0
        });
      }, this);
    });

    it('should count correctly the different kind of partstat', function() {
      var needAction = { partstat: 'NEEDS-ACTION' };
      var accepted = { partstat: 'ACCEPTED' };
      var tentative = { partstat: 'TENTATIVE' };
      var declined = { partstat: 'DECLINED' };
      var other1 = { partstat: 'e' };
      var other2 = { partstat: 'us' };
      var other3 = { partstat: 'eless' };
      var attendees = [needAction, other1, accepted, other2, tentative, other3, declined, accepted, tentative];

      expect(self.calEventMessageService.computeAttendeeStats(attendees)).to.deep.equal({
        'NEEDS-ACTION': 1,
        ACCEPTED: 2,
        TENTATIVE: 2,
        DECLINED: 1,
        OTHER: 3
      });
    });

  });
});
