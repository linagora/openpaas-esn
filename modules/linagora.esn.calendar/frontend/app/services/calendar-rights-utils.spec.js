'use strict';

/* global chai, _: false */

var expect = chai.expect;

describe('The CalCalendarRightsUtilsService service', function() {
  var self;

  beforeEach(function() {
    self = this;
    angular.mock.module('esn.calendar');
  });

  beforeEach(angular.mock.inject(function(CalCalendarRightsUtilsService, CAL_CALENDAR_PUBLIC_RIGHT_HUMAN_READABLE, CAL_CALENDAR_PUBLIC_RIGHT) {
    this.CalCalendarRightsUtilsService = CalCalendarRightsUtilsService;
    this.CAL_CALENDAR_PUBLIC_RIGHT_HUMAN_READABLE = CAL_CALENDAR_PUBLIC_RIGHT_HUMAN_READABLE;
    this.CAL_CALENDAR_PUBLIC_RIGHT = CAL_CALENDAR_PUBLIC_RIGHT;
  }));

  describe('The asHumanReadable function', function() {
    it('should return unknown when input is not defined', function() {
      expect(this.CalCalendarRightsUtilsService.asHumanReadable()).to.equal(this.CAL_CALENDAR_PUBLIC_RIGHT_HUMAN_READABLE.unknown);
    });

    it('should return unknown when right is not known', function() {
      expect(this.CalCalendarRightsUtilsService.asHumanReadable(this.CAL_CALENDAR_PUBLIC_RIGHT.READ + 'you do not know me right???')).to.equal(this.CAL_CALENDAR_PUBLIC_RIGHT_HUMAN_READABLE.unknown);
    });

    it('should return human readable value', function() {
      _.forEach(this.CAL_CALENDAR_PUBLIC_RIGHT, function(value) {
        var result = self.CalCalendarRightsUtilsService.asHumanReadable(value);

        expect(result).to.be.a.string;
        expect(result).to.not.equal(self.CAL_CALENDAR_PUBLIC_RIGHT_HUMAN_READABLE.unknown);
      });
    });
  });
});
