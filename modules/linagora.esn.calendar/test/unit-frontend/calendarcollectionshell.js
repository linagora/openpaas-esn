'use strict';

/* global chai: false */
var expect = chai.expect;

describe('CalendarCollectionShell factory', function() {

  beforeEach(function() {
    angular.mock.module('esn.calendar');
  });

  beforeEach(function() {
    angular.mock.inject(function(CalendarCollectionShell) {
      this.CalendarCollectionShell = CalendarCollectionShell;
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
      expect(calendarCollection.getName()).to.equal('name');
      expect(calendarCollection.getColor()).to.equal('color');
      expect(calendarCollection.getDescription()).to.equal('description');
      expect(calendarCollection.getHref()).to.equal('/calendars/56095ccccbd51b7318ce6d0c/db0d5d63-c36a-42fc-9684-6f5e8132acfe.json');
      expect(calendarCollection.getId()).to.equal('db0d5d63-c36a-42fc-9684-6f5e8132acfe');
    });
  });

  describe('buildHref fn', function() {
    it('should return the correct href', function() {
      expect(this.CalendarCollectionShell.buildHref('aHomeId', 'aSubId')).to.equal('/calendars/aHomeId/aSubId.json');
    });
  });
});
