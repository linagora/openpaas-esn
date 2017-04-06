'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('CalendarCollectionShell factory', function() {
  var $rootScope, CalendarCollectionShell, calendarRightShell, calendar, CAL_DEFAULT_CALENDAR_ID, CAL_CALENDAR_PUBLIC_RIGHT,
    CAL_CALENDAR_SHARED_RIGHT, calendarSharedRight, calendarPublicRight, calendarOwner, calendarOwnerId, userAPIMock;

  calendar = {
    _links: {
      self: {
        href: '/calendars/56095ccccbd51b7318ce6d0c/db0d5d63-c36a-42fc-9684-6f5e8132acfe.json'
      }
    },
    name: 'name',
    color: 'color',
    description: 'description',
    acl: 'acl',
    invite: 'invite'
  };

  calendarOwnerId = 'ownerId';

  calendarRightShell = sinon.spy(function() {
    return {
      getOwnerId: function() {
        return calendarOwnerId;
      },
      getShareeRight: function() {
        return calendarSharedRight;
      },
      getPublicRight: function() {
        return calendarPublicRight;
      }
    };
  });

  calendarOwner = {
    firstname: 'owner'
  };

  userAPIMock = {
    user: function(userId) {
      if (userId === 'ownerId') {
        return $q.when({
          data: calendarOwner
        });
      }

      return $q.when({data: {}});
    }
  };

  beforeEach(angular.mock.module('esn.calendar', function($provide) {
      $provide.value('CalendarRightShell', calendarRightShell);
      $provide.value('userAPI', userAPIMock);
    })
  );

  beforeEach(function() {
    angular.mock.inject(function(_$rootScope_, _CalendarCollectionShell_, _CAL_DEFAULT_CALENDAR_ID_, _CAL_CALENDAR_PUBLIC_RIGHT_, _CAL_CALENDAR_SHARED_RIGHT_) {
      $rootScope = _$rootScope_;
      CalendarCollectionShell = _CalendarCollectionShell_;
      CAL_DEFAULT_CALENDAR_ID = _CAL_DEFAULT_CALENDAR_ID_;
      CAL_CALENDAR_PUBLIC_RIGHT = _CAL_CALENDAR_PUBLIC_RIGHT_;
      CAL_CALENDAR_SHARED_RIGHT = _CAL_CALENDAR_SHARED_RIGHT_;
    });
  });

  describe('CalendarCollectionShell constructor', function() {
    it('should initialize CalendarRightShell when calling CalendarCollectionShell ', function() {
      new CalendarCollectionShell(calendar);

      expect(calendarRightShell).to.have.been.calledWith(calendar.acl, calendar.invite);
    });

    it('should call initialize acl with calendar.acl', function() {
      var test = new CalendarCollectionShell(calendar);

      expect(test.acl).to.deep.equal(calendar.acl);
    });

    it('should call initialize invite with calendar.invite', function() {
      var test = new CalendarCollectionShell(calendar);

      expect(test.invite).to.deep.equal(calendar.invite);
    });

    it('should call initialize readOnly with true if the user right is SHAREE_READ', function() {
      calendarSharedRight = CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ;
      var test = new CalendarCollectionShell(calendar);

      expect(test.readOnly).to.be.true;
    });

    it('should call initialize readOnly with true if the user right is SHAREE_FREE_BUSY', function() {
      calendarSharedRight = CAL_CALENDAR_SHARED_RIGHT.SHAREE_FREE_BUSY;
      var test = new CalendarCollectionShell(calendar);

      expect(test.readOnly).to.be.true;
    });

    it('should call initialize readOnly with true if the user right is READ', function() {
      calendarPublicRight = CAL_CALENDAR_PUBLIC_RIGHT.READ;
      var test = new CalendarCollectionShell(calendar);

      expect(test.readOnly).to.be.true;
    });
  });

  describe('isAdmin fn', function() {
    it('Should return false if the user is not the owner and have not SHAREE_ADMIN rights', function() {
      var test = new CalendarCollectionShell(calendar);

      expect(test.isAdmin('someone_else')).to.be.false;
    });

    it('Should return true if the user is the owner', function() {
      var test = new CalendarCollectionShell(calendar);

      expect(test.isAdmin('ownerId')).to.be.true;
    });

    it('Should return true if the user is not the owner but have SHAREE_ADMIN rights', function() {
      calendarSharedRight = CAL_CALENDAR_SHARED_RIGHT.SHAREE_ADMIN;

      var test = new CalendarCollectionShell(calendar);

      expect(test.isAdmin('someone_else')).to.be.true;
    });
  });
  describe('isShared fn', function() {
    it('Should return false if calendar has no Sharee Right', function() {
      calendarSharedRight = undefined;
      var test = new CalendarCollectionShell(calendar);

      expect(test.isShared()).to.be.false;
    });

    it('Should return true if calendar has Sharee Right', function() {
      calendarSharedRight = CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ;
      var test = new CalendarCollectionShell(calendar);

      expect(test.isShared()).to.be.true;
    });
  });

  describe('isPublic fn', function() {

    it('Should return false if the public right of calendar is different of READ and WRITE', function() {
      calendarPublicRight = undefined;
      var test = new CalendarCollectionShell(calendar);

      expect(test.isPublic()).to.be.false;
    });

    it('Should return true if calendar is public', function() {
      calendarPublicRight = CAL_CALENDAR_PUBLIC_RIGHT.READ;
      var test = new CalendarCollectionShell(calendar);

      expect(test.isPublic()).to.be.true;
    });

    it('Should return true if calendar is public', function() {
      calendarPublicRight = CAL_CALENDAR_PUBLIC_RIGHT.READ_WRITE;
      var test = new CalendarCollectionShell(calendar);

      expect(test.isPublic()).to.be.true;
    });
  });

  describe('isOwner fn', function() {

    it('Should return false if the user is not the owner', function() {
      var test = new CalendarCollectionShell(calendar);

      expect(test.isOwner('someone_else')).to.be.false;
    });

    it('Should return true if the user is the owner', function() {
      var test = new CalendarCollectionShell(calendar);

      expect(test.isOwner('ownerId')).to.be.true;
    });
  });

  describe('toDavCalendar fn', function() {
    it('should return the correct format even with a simple object', function() {
      expect(CalendarCollectionShell.toDavCalendar({
        href: '/calendars/56095ccccbd51b7318ce6d0c/db0d5d63-c36a-42fc-9684-6f5e8132acfe.json',
        name: 'name',
        color: 'color',
        description: 'description',
        acl: 'acl',
        invite: 'invite'
      })).to.deep.equal({
        'dav:name': 'name',
        'apple:color': 'color',
        'caldav:description': 'description',
        id: 'db0d5d63-c36a-42fc-9684-6f5e8132acfe',
        acl: 'acl',
        invite: 'invite'
      });
    });

    it('should set selected on calendar with CAL_DEFAULT_CALENDAR_ID', function() {
      expect(CalendarCollectionShell.from({
        href: '/calendars/56095ccccbd51b7318ce6d0c/' + CAL_DEFAULT_CALENDAR_ID + '.json',
        acl: 'acl',
        invite: 'invite'
      })).to.shallowDeepEqual({
        selected: true
      });
    });

    it('should return the correct format if a CalendarCollectionShell is passed', function() {
      var davCalendar = {
        _links: {
          self: {
            href: '/calendars/56095ccccbd51b7318ce6d0c/db0d5d63-c36a-42fc-9684-6f5e8132acfe.json'
          }
        },
        'dav:name': 'name',
        'apple:color': 'color',
        'caldav:description': 'description',
        acl: 'acl',
        invite: 'invite'
      };

      expect(CalendarCollectionShell.toDavCalendar(new CalendarCollectionShell(davCalendar))).to.deep.equal({
        'dav:name': 'name',
        'apple:color': 'color',
        'caldav:description': 'description',
        id: 'db0d5d63-c36a-42fc-9684-6f5e8132acfe',
        acl: 'acl',
        invite: 'invite'
      });
    });
  });

  describe('from fn', function() {
    it('should create a correct CalendarCollectionShell from a formatted object', function() {
      var calendarCollection = CalendarCollectionShell.from({
        name: 'name',
        color: 'color',
        description: 'description',
        href: '/calendars/56095ccccbd51b7318ce6d0c/db0d5d63-c36a-42fc-9684-6f5e8132acfe.json',
        acl: 'acl',
        invite: 'invite'
      });

      expect(calendarCollection.name).to.equal('name');
      expect(calendarCollection.color).to.equal('color');
      expect(calendarCollection.description).to.equal('description');
      expect(calendarCollection.href).to.equal('/calendars/56095ccccbd51b7318ce6d0c/db0d5d63-c36a-42fc-9684-6f5e8132acfe.json');
      expect(calendarCollection.id).to.equal('db0d5d63-c36a-42fc-9684-6f5e8132acfe');
      expect(calendarCollection.rights).to.be.defined;
    });
  });

  describe('buildHref fn', function() {
    it('should return the correct href', function() {
      expect(CalendarCollectionShell.buildHref('aHomeId', 'aSubId')).to.equal('/calendars/aHomeId/aSubId.json');
    });
  });

  describe('getOwner function', function() {

    it('should return the calendar owner from a calendar', function(done) {
      var test = new CalendarCollectionShell(calendar);

      test.getOwner().then(function(owner) {
        expect(owner).to.deep.equal(calendarOwner);

        done();
      });

      $rootScope.$digest();
    });

    it('should return an empty object if we do not find the owner', function(done) {
      calendarOwnerId = 'someone_else';
      var test = new CalendarCollectionShell(calendar);

      test.getOwner().then(function(owner) {
        expect(owner).to.deep.equal({});

        done();
      });

      $rootScope.$digest();
    });
  });
});
