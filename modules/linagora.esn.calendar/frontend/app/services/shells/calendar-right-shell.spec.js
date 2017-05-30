'use strict';

/* global chai, __FIXTURES__, _: false */

var expect = chai.expect;

describe('CalendarRightShell factory', function() {
  var session, CalendarRightShell, calendarRightShell, CAL_CALENDAR_PUBLIC_RIGHT, CAL_CALENDAR_SHARED_RIGHT, defaultOwnerId;

  beforeEach(function() {
    defaultOwnerId = 'ownerId';

    session = {
      user: {
        _id: defaultOwnerId
      },
      ready: {
        then: angular.noop
      }
    };

    angular.mock.module('esn.calendar');

    angular.mock.module(function($provide) {
      $provide.value('session', session);
    });

    angular.mock.inject(function(_CalendarRightShell_, _session_, _CAL_CALENDAR_PUBLIC_RIGHT_, _CAL_CALENDAR_SHARED_RIGHT_) {
      CalendarRightShell = _CalendarRightShell_;
      session = _session_;
      CAL_CALENDAR_PUBLIC_RIGHT = _CAL_CALENDAR_PUBLIC_RIGHT_;
      CAL_CALENDAR_SHARED_RIGHT = _CAL_CALENDAR_SHARED_RIGHT_;
    });

    var serverPropfindResponse = JSON.parse(__FIXTURES__['modules/linagora.esn.calendar/test/unit-frontend/fixtures/shell/propfind_right_result.json']);

    calendarRightShell = new CalendarRightShell(serverPropfindResponse.acl, serverPropfindResponse.invite);
  });

  describe('Constructor', function() {
    it('should initialize ownerId with defaultOwnerId when invite are not specified', function() {
      calendarRightShell = new CalendarRightShell();
      expect(calendarRightShell.getOwnerId()).to.be.equal(defaultOwnerId);
    });

    it('should initialize ownerId with passed ownedId', function() {
      var publicOwnerId = 'publicOwnerId';

      calendarRightShell = new CalendarRightShell([], [], publicOwnerId);
      expect(calendarRightShell.getOwnerId()).to.be.equal(publicOwnerId);
    });
  });

  describe('getOwnerId', function() {
    it('should return id of the calendar owner', function() {
      expect(calendarRightShell.getOwnerId()).to.be.equal('me');
    });

    it('should convert properly calendar.access to String to match CAL_CALENDAR_SHARED_RIGHT constants', function() {
      expect(calendarRightShell.getShareeRight('tom')).to.equal(CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ_WRITE);
      expect(calendarRightShell.getShareeRight('jerry')).to.equal(CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ);
    });
  });

  describe('getOwnerId', function() {
    it('should return id of the calendar owner', function() {
      expect(calendarRightShell.getOwnerId()).to.be.equal('me');
    });

    it('should convert properly calendar.access to String to match CAL_CALENDAR_SHARED_RIGHT constants', function() {
      expect(calendarRightShell.getShareeRight('tom')).to.equal(CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ_WRITE);
      expect(calendarRightShell.getShareeRight('jerry')).to.equal(CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ);
    });
  });

  describe('getShareeRight', function() {
    it('should convert properly calendar.access to String to match CAL_CALENDAR_SHARED_RIGHT constants', function() {
      expect(calendarRightShell.getShareeRight('tom')).to.equal(CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ_WRITE);
      expect(calendarRightShell.getShareeRight('jerry')).to.equal(CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ);
    });
  });

  describe('getUsersEmails function', function() {
    it('should return the _userEmails attribute', function() {
      expect(calendarRightShell.getUsersEmails()).to.deep.equal(calendarRightShell._userEmails);
    });
  });

  describe('getPublicRight', function() {
    it('should return rights of all the users', function() {
      expect(calendarRightShell.getPublicRight(), CAL_CALENDAR_PUBLIC_RIGHT.READ_WRITE);
    });
  });

  describe('update function', function() {
    it('should set the right of a user if there was none', function() {
      calendarRightShell.updateSharee('bipbip', 'userEmail', CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ_WRITE);

      expect(calendarRightShell.getShareeRight('bipbip')).to.equal(CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ_WRITE);
    });

    it('should update the right of an existing user', function() {
      calendarRightShell.updateSharee('me', 'myEmail', CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ_WRITE);
      expect(calendarRightShell.getShareeRight('me')).to.equal(CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ_WRITE);
    });
  });

  describe('The update public method', function() {
    it('should update the right of the public user correctly', function() {
      calendarRightShell.updatePublic(CAL_CALENDAR_PUBLIC_RIGHT.READ);
      expect(calendarRightShell.getPublicRight()).to.equal(CAL_CALENDAR_PUBLIC_RIGHT.READ);
    });
  });

  describe('toJson', function() {
    it('should return a json that allow comparaison for equals', function() {
      expect(calendarRightShell.toJson()).to.be.deep.equals({
        public: CAL_CALENDAR_PUBLIC_RIGHT.READ_WRITE,
        sharee: {
          tom: CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ_WRITE,
          jerry: CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ
        },
        ownerId: 'me'
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
      other.updateSharee('other', 'other@open-paas.org', CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ_WRITE);
      expect(other.equals(calendarRightShell)).to.be.false;
    });

    it('should be false for different public', function() {
      var other = calendarRightShell.clone();
      other.updatePublic(CAL_CALENDAR_PUBLIC_RIGHT.READ);
      expect(other.equals(calendarRightShell)).to.be.false;
    });
  });

  describe('the removeUserRight method', function() {
    it('should correctly remove a sharee user right', function() {
      calendarRightShell.removeShareeRight('tom');
      expect(calendarRightShell.getShareeRight('tom')).to.be.undefined;
      expect(_.find(calendarRightShell.getAllShareeRights(), {userId: 'tom'})).to.be.undefined;
    });

    it('should not fail if attending to remove an unexisting user', function() {
      calendarRightShell.removeShareeRight('god');
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
      calendarRightShell.updateSharee('tom', 'user2@open-paas.org', CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ);
      calendarRightShell.updateSharee('jerry', 'user3@open-paas.org', CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ_WRITE);

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
      calendarRightShell.removeShareeRight('jerry');
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
