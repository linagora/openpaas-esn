'use strict';

/* global chai, __FIXTURES__, _: false */

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
      expect(calendarRightShell.getUserRight('jerry')).to.equal(CALENDAR_RIGHT.SHAREE_READ);
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

  describe('toJson', function() {
    it('should return a json that allow comparaison for equals', function() {
      expect(calendarRightShell.toJson()).to.be.deep.equals({
        users: {me: 158, tom: 64, jerry: 32},
        public: 1
      });
    });
  });

  describe('clone method', function() {
    it('should return a clone that is equals but independant from the original shell', function() {
      var clone = calendarRightShell.clone();

      expect(clone === calendarRightShell).to.be.false;
      expect(clone.equals(calendarRightShell)).to.be.true;
    });

    it('should also clone email', function() {
      var clone = calendarRightShell.clone();

      expect(clone._userEmails).to.be.deep.equals(calendarRightShell._userEmails);
    });
  });

  describe('the equal method', function() {
    it('should not fail for bad object', function() {
      [null, undefined, {}, [], {users: {}, public: {}}].forEach(function(badData) {
        expect(calendarRightShell.equals(badData)).to.be.false;
      });
    });

    it('should be true for the same instance', function() {
      expect(calendarRightShell.equals(calendarRightShell)).to.be.true;
    });

    it('should be false for different user', function() {
      var other = calendarRightShell.clone();
      other.update('other', 'other@open-paas.org', CALENDAR_RIGHT.FREE_BUSY);
      expect(other.equals(calendarRightShell)).to.be.false;
    });

    it('should be false for different public', function() {
      var other = calendarRightShell.clone();
      other.updatePublic(CALENDAR_RIGHT.PUBLIC_READ);
      expect(other.equals(calendarRightShell)).to.be.false;
    });
  });

  describe('the removeUserRight method', function() {
    it('should correctly remove a user write', function() {
      calendarRightShell.removeUserRight('tom');
      expect(calendarRightShell.getUserRight('tom')).to.be.undefined;
      expect(_.find(calendarRightShell.getAllUserRight(), {userId: 'tom'})).to.be.undefined;
    });

    it('should not fail if attending to remove an unexisting user', function() {
      calendarRightShell.removeUserRight('god');
    });
  });

  describe('the toDAVShareRightsUpdate method', function() {
    it('should output correct add array for new READ and READ_WRITE authorisation', function() {
      expect(calendarRightShell.toDAVShareRightsUpdate(new CalendarRightShell())).to.deep.equals({
        share: {
          set: [{
            'dav:href': 'mailto:user2@open-paas.org',
            'dav:read-write': true
          }, {
            'dav:href': 'mailto:user3@open-paas.org',
            'dav:read': true
          }],
          remove: []
        }
      });
    });

    it('should correctly deal with update of READ to READ_WRITE and to READ_WRITE to READ', function() {
      var original = calendarRightShell.clone();
      calendarRightShell.update('tom', 'user2@open-paas.org', CALENDAR_RIGHT.SHAREE_READ);
      calendarRightShell.update('jerry', 'user3@open-paas.org', CALENDAR_RIGHT.READ_WRITE);

      expect(calendarRightShell.toDAVShareRightsUpdate(original)).to.deep.equals({
        share: {
          set: [{
            'dav:href': 'mailto:user2@open-paas.org',
            'dav:read': true
          }, {
            'dav:href': 'mailto:user3@open-paas.org',
            'dav:read-write': true
          }],
          remove: []
        }
      });
    });

    it('should correctly remove removed user', function() {
      var original = calendarRightShell.clone();
      calendarRightShell.removeUserRight('jerry');
      expect(calendarRightShell.toDAVShareRightsUpdate(original)).to.deep.equals({
        share: {
          set: [{
            'dav:href': 'mailto:user2@open-paas.org',
            'dav:read-write': true
          }],
          remove: [{
            'dav:href': 'mailto:user3@open-paas.org'
          }]
        }
      });
    });

    it('should remove user sharee if there are downgraded to free buzy', function() {
      var original = calendarRightShell.clone();
      calendarRightShell.update('jerry', 'user3@open-paas.org', CALENDAR_RIGHT.FREE_BUSY);
      expect(calendarRightShell.toDAVShareRightsUpdate(original)).to.deep.equals({
        share: {
          set: [{
            'dav:href': 'mailto:user2@open-paas.org',
            'dav:read-write': true
          }],
          remove: [{
            'dav:href': 'mailto:user3@open-paas.org'
          }]
        }
      });
    });

    it('should remove user sharee if there are downgraded to none', function() {
      var original = calendarRightShell.clone();
      calendarRightShell.update('jerry', 'user3@open-paas.org', CALENDAR_RIGHT.NONE);
      expect(calendarRightShell.toDAVShareRightsUpdate(original)).to.deep.equals({
        share: {
          set: [{
            'dav:href': 'mailto:user2@open-paas.org',
            'dav:read-write': true
          }],
          remove: [{
            'dav:href': 'mailto:user3@open-paas.org'
          }]
        }
      });
    });
  });
});
