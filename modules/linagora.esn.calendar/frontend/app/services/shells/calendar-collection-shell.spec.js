'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('CalendarCollectionShell factory', function() {
  var CalendarRightShellMock, calendar, CALENDAR_RIGHT, CALENDAR_SHARED_RIGHT, calendarRight, calendarSharedRight;

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

  CalendarRightShellMock = sinon.spy(function() {
    return {
      getUserRight: function() {
        return calendarRight;
      },
      getShareeRight: function() {
        return calendarSharedRight;
      }
    };
  });

  beforeEach(angular.mock.module('esn.calendar', function($provide) {
      $provide.value('CalendarRightShell', CalendarRightShellMock);
    })
  );

  beforeEach(function() {
    angular.mock.inject(function(CalendarCollectionShell, DEFAULT_CALENDAR_ID, _CALENDAR_RIGHT_, _CALENDAR_SHARED_RIGHT_) {
      this.CalendarCollectionShell = CalendarCollectionShell;
      this.DEFAULT_CALENDAR_ID = DEFAULT_CALENDAR_ID;
      CALENDAR_RIGHT = _CALENDAR_RIGHT_;
      CALENDAR_SHARED_RIGHT = _CALENDAR_SHARED_RIGHT_;
    });
  });

  describe('CalendarCollectionShell constructor', function() {
    it('should call CalendarRightShell if the calendar has the acl and the invite fields', function() {
      this.CalendarCollectionShell(calendar);

      expect(CalendarRightShellMock).to.have.been.calledWith(calendar.acl, calendar.invite);
    });

    it('should call initialize acl with calendar.acl', function() {
      this.CalendarCollectionShell(calendar);

      expect(this.acl).to.deep.equal(calendar.acl);
    });

    it('should call initialize invite with calendar.invite', function() {
      this.CalendarCollectionShell(calendar);

      expect(this.invite).to.deep.equal(calendar.invite);
    });

    it('should call initialize readOnly with true if the user right is SHAREE_READ', function() {
      calendarSharedRight = CALENDAR_SHARED_RIGHT.SHAREE_READ;
      this.CalendarCollectionShell(calendar);

      expect(this.readOnly).to.be.true;
    });

    it('should call initialize readOnly with true if the user right is PUBLIC_READ', function() {
      calendarRight = CALENDAR_RIGHT.PUBLIC_READ;
      this.CalendarCollectionShell(calendar);

      expect(this.readOnly).to.be.true;
    });
  });

  describe('isShared fn', function() {
    it('Should return false if calendar has no Sharee Right', function() {
      calendarSharedRight = undefined;
      var test = new this.CalendarCollectionShell(calendar);

      expect(test.isShared()).to.be.false;
    });

    it('Should return true if calendar has Sharee Right', function() {
      calendarSharedRight = CALENDAR_SHARED_RIGHT.SHAREE_READ;
      var test = new this.CalendarCollectionShell(calendar);

      expect(test.isShared()).to.be.true;
    });
  });

  describe('toDavCalendar fn', function() {
    it('should return the correct format even with a simple object', function() {
      expect(this.CalendarCollectionShell.toDavCalendar({
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

    it('should set selected on calendar with DEFAULT_CALENDAR_ID', function() {
      expect(this.CalendarCollectionShell.from({
        href: '/calendars/56095ccccbd51b7318ce6d0c/' + this.DEFAULT_CALENDAR_ID + '.json',
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

      expect(this.CalendarCollectionShell.toDavCalendar(new this.CalendarCollectionShell(davCalendar))).to.deep.equal({
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
      var calendarCollection = this.CalendarCollectionShell.from({
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
      expect(this.CalendarCollectionShell.buildHref('aHomeId', 'aSubId')).to.equal('/calendars/aHomeId/aSubId.json');
    });
  });
});
