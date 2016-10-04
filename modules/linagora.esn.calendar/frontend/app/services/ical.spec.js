'use strict';

/* global chai: false */
/* global __FIXTURES__: false */

var expect = chai.expect;

describe('The ICAL Angular module', function() {
  beforeEach(angular.mock.module('esn.ical'));

  describe('icalParserService service', function() {

    describe('The parseICS fn', function() {

      beforeEach(angular.mock.inject(function(ICAL) {
        this.ICAL = ICAL;
      }));

      it('should parse the given ICS data', function() {
        var ICAL = this.ICAL;
        var result = ICAL.parse(__FIXTURES__['modules/linagora.esn.calendar/frontend/app/fixtures/calendar/event.ics']);

        expect(result).to.exist;

        var comp = new ICAL.Component(result);
        var vevent = comp.getFirstSubcomponent('vevent');
        var summary = vevent.getFirstPropertyValue('summary');

        expect(summary).to.match(/Really long event name thing/);
      });
    });
  });
});
