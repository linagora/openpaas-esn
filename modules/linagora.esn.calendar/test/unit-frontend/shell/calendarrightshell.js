'use strict';

/* global chai, __FIXTURES__: false */

var expect = chai.expect;

describe('CalendarRightShell factory', function() {
  var CalendarRightShell, calendarRightShell, CALENDAR_RIGHT;

  beforeEach(function() {
    angular.mock.module('esn.calendar');
    angular.mock.inject(function(_CalendarRightShell_, _CALENDAR_RIGHT_) {
      CalendarRightShell = _CalendarRightShell_;
      CALENDAR_RIGHT = _CALENDAR_RIGHT_;
    });

    var serverPropfindResponse = JSON.parse(__FIXTURES__['modules/linagora.esn.calendar/test/unit-frontend/fixtures/shell/propfind_right_result.json']);

    calendarRightShell = new CalendarRightShell(serverPropfindResponse.acl, serverPropfindResponse.invite);
  });

  describe('getUserRight', function() {
    it('should return nothing for user not in the server response', function() {
      expect(calendarRightShell.getUserRight('toto')).to.be.undefined;
    });

    it('should return admin for admin user', function() {
      expect(calendarRightShell.getUserRight('me')).to.equal(CALENDAR_RIGHT.ADMIN);
    });

    it('should return read write for read-write user', function() {
      expect(calendarRightShell.getUserRight('tom')).to.equal(CALENDAR_RIGHT.READ_WRITE);
    });

    it('should return read for read user', function() {
      expect(calendarRightShell.getUserRight('jerry')).to.equal(CALENDAR_RIGHT.READ);
    });
  });

  describe('getPublicRight', function() {
    it('should return write for all the user', function() {
      expect(calendarRightShell.getPublicRight(), CALENDAR_RIGHT.FREE_BUSY);
    });
  });
});
