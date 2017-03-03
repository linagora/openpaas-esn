'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('CalendarCollectionShell factory', function() {
  var CalendarRightShellMock;

  CalendarRightShellMock = sinon.spy();

  beforeEach(angular.mock.module('esn.calendar'));

  beforeEach(function() {
    angular.mock.module(function($provide) {
      $provide.value('CalendarRightShell', CalendarRightShellMock);
    });
  });

  beforeEach(function() {
    angular.mock.inject(function(CalendarCollectionShell, DEFAULT_CALENDAR_ID) {
      this.CalendarCollectionShell = CalendarCollectionShell;
      this.DEFAULT_CALENDAR_ID = DEFAULT_CALENDAR_ID;
    });
  });

  describe('CalendarCollectionShell constructor', function() {
    it('should call CalendarRightShell if the calendar has the acl and the invite fields', function() {
      var calendar = {
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

      this.CalendarCollectionShell(calendar);

      expect(CalendarRightShellMock).to.have.been.calledWith(calendar.acl, calendar.invite);
    });
  });

  describe('toDavCalendar fn', function() {
    it('should return the correct format even with a simple object', function() {
      expect(this.CalendarCollectionShell.toDavCalendar({
        href: '/calendars/56095ccccbd51b7318ce6d0c/db0d5d63-c36a-42fc-9684-6f5e8132acfe.json',
        name: 'name',
        color: 'color',
        description: 'description'
      })).to.deep.equal({
        'dav:name': 'name',
        'apple:color': 'color',
        'caldav:description': 'description',
        id: 'db0d5d63-c36a-42fc-9684-6f5e8132acfe'
      });
    });

    it('should set selected on calendar with DEFAULT_CALENDAR_ID', function() {
      expect(this.CalendarCollectionShell.from({
        href: '/calendars/56095ccccbd51b7318ce6d0c/' + this.DEFAULT_CALENDAR_ID + '.json'
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
        'caldav:description': 'description'
      };

      expect(this.CalendarCollectionShell.toDavCalendar(new this.CalendarCollectionShell(davCalendar))).to.deep.equal({
        'dav:name': 'name',
        'apple:color': 'color',
        'caldav:description': 'description',
        id: 'db0d5d63-c36a-42fc-9684-6f5e8132acfe'
      });
    });
  });

  describe('from fn', function() {
    it('should create a correct CalendarCollectionShell from a formatted object', function() {
      var calendarCollection = this.CalendarCollectionShell.from({
        name: 'name',
        color: 'color',
        description: 'description',
        href: '/calendars/56095ccccbd51b7318ce6d0c/db0d5d63-c36a-42fc-9684-6f5e8132acfe.json'
      });

      expect(calendarCollection.name).to.equal('name');
      expect(calendarCollection.color).to.equal('color');
      expect(calendarCollection.description).to.equal('description');
      expect(calendarCollection.href).to.equal('/calendars/56095ccccbd51b7318ce6d0c/db0d5d63-c36a-42fc-9684-6f5e8132acfe.json');
      expect(calendarCollection.id).to.equal('db0d5d63-c36a-42fc-9684-6f5e8132acfe');
    });
  });

  describe('buildHref fn', function() {
    it('should return the correct href', function() {
      expect(this.CalendarCollectionShell.buildHref('aHomeId', 'aSubId')).to.equal('/calendars/aHomeId/aSubId.json');
    });
  });
});
