'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The partstat filter', function() {

  beforeEach(function() {
    angular.mock.module('esn.calendar');
  });

  beforeEach(angular.mock.inject(function(_$filter_) {
    this.$filter = _$filter_;
  }));

  describe('The partstat filter', function() {
    it('should filter attendess by parstat', function() {
      var attendees = [
        {
          id: 1,
          partstat: 'NEEDS-ACTION'
        },
        {
          id: 2,
          partstat: 'ACCEPTED'
        },
        {
          id: 3,
          partstat: 'NEEDS-ACTION'
        },
        {
          id: 4,
          partstat: 'ACCEPTED'
        },
        {
          id: 5,
          partstat: 'NEEDS-ACTION'
        },
        {
          id: 6,
          partstat: 'DECLINED'
        },
        {
          id: 7,
          partstat: 'DECLINED'
        }
      ];
      var declinedAttendees, acceptedAttendees, needsActionAttendees;

      declinedAttendees = this.$filter('partstat')(attendees, 'DECLINED');
      acceptedAttendees = this.$filter('partstat')(attendees, 'ACCEPTED');
      needsActionAttendees = this.$filter('partstat')(attendees, 'NEEDS-ACTION');

      expect(declinedAttendees).to.deep.equal([
        {
          id: 6,
          partstat: 'DECLINED'
        },
        {
          id: 7,
          partstat: 'DECLINED'
        }
      ]);

      expect(acceptedAttendees).to.deep.equal([
        {
          id: 2,
          partstat: 'ACCEPTED'
        },
        {
          id: 4,
          partstat: 'ACCEPTED'
        }
      ]);

      expect(needsActionAttendees).to.deep.equal([
        {
          id: 1,
          partstat: 'NEEDS-ACTION'
        },
        {
          id: 3,
          partstat: 'NEEDS-ACTION'
        },
        {
          id: 5,
          partstat: 'NEEDS-ACTION'
        }
      ]);
    });

  });
});
