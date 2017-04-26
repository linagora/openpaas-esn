'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('the calPublicCalendarStore service', function() {
  var $rootScope, calPublicCalendarStore, CAL_EVENTS, calendarsAddListener, _, publicCalendars;

  beforeEach(function() {
    angular.mock.module('esn.calendar');

    angular.mock.inject(function(_$rootScope_, _calPublicCalendarStore_, ___, _CAL_EVENTS_) {
      $rootScope = _$rootScope_;
      calPublicCalendarStore = _calPublicCalendarStore_;
      CAL_EVENTS = _CAL_EVENTS_;
      _ = ___;
    });
  });

  beforeEach(function() {
    publicCalendars = [
      {
        id: 'firstCalendar'
      },
      {
        id: 'secondCalendar'
      }];

    calendarsAddListener = sinon.spy();
    $rootScope.$on(CAL_EVENTS.CALENDARS.ADD, calendarsAddListener);
  });

  describe('the getAll method', function() {
    it('should store calendars in publicCalendar', function() {
      calPublicCalendarStore.storeAll(publicCalendars);
      expect(calPublicCalendarStore.getAll()).to.deep.equal(_.values(publicCalendars));
    });
  });

  describe('the getById method', function() {
    it('should get calendars in publicCalendar', function() {
      calPublicCalendarStore.storeAll(publicCalendars);
      expect(calPublicCalendarStore.getById('firstCalendar')).to.deep.equal({id: 'firstCalendar'});
    });
  });

  describe('the storeAll method', function() {
    it('should $broadcast for each added calendar', function() {
      calPublicCalendarStore.storeAll(publicCalendars);

      expect(calendarsAddListener).to.have.been.called.twice;
      expect(calendarsAddListener.firstCall).to.have.been.calledWith(sinon.match.any, publicCalendars[0]);
      expect(calendarsAddListener.secondCall).to.have.been.calledWith(sinon.match.any, publicCalendars[1]);
    });
  });
});
