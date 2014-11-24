'use strict';

/* global chai: false */
/* global __FIXTURES__: false */

var expect = chai.expect;

describe('The ICAL Angular module', function() {
  beforeEach(angular.mock.module('esn.ical'));

  describe('icalParserService service', function() {

    describe('The parseICS fn', function() {

      beforeEach(angular.mock.inject(function(icalParserService, ICALFactory) {
        this.icalParserService = icalParserService;
        this.ICALFactory = ICALFactory;
      }));

      it('should parse the given ICS data', function() {
        var result = this.icalParserService.parseICS(__FIXTURES__['test/unit-frontend/fixtures/calendar/event.ics']);
        expect(result).to.exist;

        var ICAL = this.ICALFactory.get();
        var comp = new ICAL.Component(result[1]);
        var vevent = comp.getFirstSubcomponent('vevent');
        var summary = vevent.getFirstPropertyValue('summary');
        expect(summary).to.match(/Really long event name thing/);
      });
    });
  });
});
