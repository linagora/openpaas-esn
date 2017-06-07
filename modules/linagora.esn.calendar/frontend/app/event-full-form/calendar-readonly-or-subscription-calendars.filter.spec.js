'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The readonlyOrSubscriptionCalendars filter', function() {
  var $filter;

  beforeEach(function() {
    angular.mock.module('esn.calendar');
  });

  beforeEach(angular.mock.inject(function(_$filter_) {
    $filter = _$filter_;
  }));

  describe('The readonlyOrSubscriptionCalendars filter', function() {
    it('should filter readOnly calendars', function() {
      var calendars = [
        {
          id: 1,
          readOnly: true,
          isSubscription: function() { return false; }
        },
        {
          id: 2,
          readOnly: false,
          isSubscription: function() { return false; }
        },
        {
          id: 3,
          readOnly: true,
          isSubscription: function() { return false; }
        }
      ];

      expect($filter('readonlyOrSubscriptionCalendars')(calendars)).to.deep.equal([calendars[1]]);
    });

    it('should filter isSubscription calendars', function() {
      var calendars = [
        {
          id: 1,
          readOnly: true,
          isSubscription: function() { return false; }
        },
        {
          id: 2,
          readOnly: true,
          isSubscription: function() { return true; }
        },
        {
          id: 3,
          readOnly: true,
          isSubscription: function() { return false; }
        }
      ];

      expect($filter('readonlyOrSubscriptionCalendars')(calendars)).to.deep.equal([calendars[1]]);
    });

  });
});
