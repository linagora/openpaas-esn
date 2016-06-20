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
    it('should return rights of all the users', function() {
      expect(calendarRightShell.getPublicRight(), CALENDAR_RIGHT.FREE_BUSY);
    });
  });

  describe('update function', function() {
    it('should set the right of a user if there was none', function() {
      calendarRightShell.update('bipbip', 'userEmail', CALENDAR_RIGHT.READ_WRITE);
      expect(calendarRightShell.getUserRight('bipbip')).to.equal(CALENDAR_RIGHT.READ_WRITE);
    });

    it('should update the right of a user if some existed', function() {
      calendarRightShell.update('me', 'myEmail', CALENDAR_RIGHT.READ_WRITE);
      expect(calendarRightShell.getUserRight('me')).to.equal(CALENDAR_RIGHT.READ_WRITE);
    });

    it('should remove the rights if called with CALENDAR_RIGHT.NONE', function() {
      calendarRightShell.update('me', 'myEmail', CALENDAR_RIGHT.NONE);
      expect(calendarRightShell.getUserRight('me')).to.equal(CALENDAR_RIGHT.NONE);
    });
  });

  describe('The update public method', function() {
    it('should update the right of the public user correctly', function() {
      calendarRightShell.updatePublic(CALENDAR_RIGHT.READ_WRITE);
      expect(calendarRightShell.getPublicRight()).to.equal(CALENDAR_RIGHT.READ_WRITE);
    });

    it('should remove the the rights if called with CALENDAR_RIGHT.PUBLIC', function() {
      calendarRightShell.updatePublic(CALENDAR_RIGHT.NONE);
      expect(calendarRightShell.getPublicRight()).to.equal(CALENDAR_RIGHT.NONE);
    });
  });
});
