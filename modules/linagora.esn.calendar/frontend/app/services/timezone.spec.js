'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The registerTimezones factory', function() {
  var ICAL, TIMEZONES;

  beforeEach(function() {
    angular.mock.module('esn.calendar');
    angular.mock.inject(function(registerTimezones, _ICAL_, _TIMEZONES_) {
      registerTimezones();
      ICAL = _ICAL_;
      TIMEZONES = _TIMEZONES_;
    });

  });

  it('should have register timezone', function() {
    angular.forEach(TIMEZONES.zones, function(_data, key) { // eslint-disable-line
      expect(ICAL.TimezoneService.get(key)).to.be.ok;
      expect(ICAL.TimezoneService.get(key).tzid).to.equal(key);
    });
  });

  it('should have register alias', function() {
    angular.forEach(TIMEZONES.aliases, function(_data, key) { // eslint-disable-line
      expect(ICAL.TimezoneService.get(key)).to.be.ok;
    });
  });

  it('should correctly follow alias', function() {
    angular.forEach(TIMEZONES.aliases, function(data, key) {
      expect(ICAL.TimezoneService.get(key)).to.equal(ICAL.TimezoneService.get(data.aliasTo));
    });
  });

});
