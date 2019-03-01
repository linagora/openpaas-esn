'use strict';

/* global chai, sinon */

var expect = chai.expect;

describe('The esnDatetimeService', function() {
  var $rootScope;
  var esnDatetimeService;

  beforeEach(function() {
    module('esn.datetime');
    module('esn.configuration');

    module(function($provide) {
      $provide.constant('esnConfig', function(argument) {
        switch (argument) {
          case 'core.language':
            return $q.when('en');
          case 'core.datetime':
            return $q.when({timeZone: 'Europe/Berlin', use24hourFormat: true});
          default:
            break;
        }
      });
    });
  });

  beforeEach(function() {
    inject(function(
      _$rootScope_,
      _esnDatetimeService_
    ) {
      $rootScope = _$rootScope_;
      esnDatetimeService = _esnDatetimeService_;
    });
  });

  describe('The format function', function() {
    it('should support mediumDate format', function(done) {
      esnDatetimeService.init().then(function() {
        var date = new Date(Date.UTC(2017, 6, 5));
        var formatted = esnDatetimeService.format(date, 'mediumDate');
        expect(formatted).to.eq('July 5, 2017');
        done();
      });
      $rootScope.$digest();
    });

    it('should support shortDate format', function(done) {
      esnDatetimeService.init().then(function() {
        var date = new Date(Date.UTC(2017, 6, 5));
        var formatted = esnDatetimeService.format(date, 'shortDate');
        expect(formatted).to.eq('07/05/2017');
        done();
      });
      $rootScope.$digest();
    });

    it('should support fullDate format', function(done) {
      esnDatetimeService.init().then(function() {
        var date = new Date(Date.UTC(2017, 6, 5));
        var formatted = esnDatetimeService.format(date, 'fullDate');
        expect(formatted).to.eq('Wednesday, July 5, 2017 2:00 AM');
        done();
      });
      $rootScope.$digest();
    });

    it('should support longDate format', function(done) {
      esnDatetimeService.init().then(function() {
        var date = new Date(Date.UTC(2017, 6, 5));
        var formatted = esnDatetimeService.format(date, 'longDate');
        expect(formatted).to.eq('July 5, 2017 2:00 AM');
        done();
      });
      $rootScope.$digest();
    });

    it('should set the timeFormat', function(done) {
      esnDatetimeService.init().then(function() {
        var timeFormatExpected = 'H:mm';
        var timeFormat = esnDatetimeService.getTimeFormat();
        expect(timeFormat).to.eq(timeFormatExpected);
        done();
      });
      $rootScope.$digest();
    });

    it('should support both date and time format', function(done) {
      esnDatetimeService.init().then(function() {
        var date = new Date(Date.UTC(2017, 11, 23, 18, 33, 11));
        var formatted = esnDatetimeService.format(date, 'mediumDate time');
        expect(formatted).to.eq('December 23, 2017 7:33 PM');
        done();
      });
      $rootScope.$digest();
    });

    it('should support moment\'s format', function(done) {
      esnDatetimeService.init().then(function() {
        var date = new Date(Date.UTC(2017, 11, 23, 18, 33, 11));
        var formatted = esnDatetimeService.format(date, 'LLLL');
        expect(formatted).to.eq('Saturday, December 23, 2017 7:33 PM');
        done();
      });
      $rootScope.$digest();
    });

    it('should format date if input is a date string value', function(done) {
      esnDatetimeService.init().then(function() {
        var date = 'Mon, 05 Jun 2017 00:00:00 GMT';
        var formatted = esnDatetimeService.format(date, 'mediumDate');
        expect(formatted).to.eq('June 5, 2017');
        done();
      });
      $rootScope.$digest();
    });
  });

  describe('The getHumanTimeGrouping function', function() {
    var clock;

    before(function() {
      clock = sinon.useFakeTimers(new Date(2018, 5, 28, 12, 24).getTime());
    });

    after(function() {
      clock.restore();
    });

    var targetDate = {
      now: function() { return targetDate.minusDays(0); },
      minusDays: function(days) { return new Date(Date.now() - (days * 24 * 60 * 60 * 1000)); },
      minusWeeks: function(weeks) { return targetDate.minusDays(7 * weeks); },
      minusMonths: function(months) {
        var d = targetDate.now();
        d.setMonth(d.getMonth() - months);
        return d;
      },
      minusYears: function(years) { return targetDate.minusMonths(12 * years); }
    };

    it('should return the correct period', function() {

      expect(esnDatetimeService.getHumanTimeGrouping(targetDate.now()).name).to.eq('Today');
      expect(esnDatetimeService.getHumanTimeGrouping(targetDate.minusDays(1)).name).to.eq('Yesterday');
      expect(esnDatetimeService.getHumanTimeGrouping(targetDate.minusDays(2)).name).to.eq('This week');
      expect(esnDatetimeService.getHumanTimeGrouping(targetDate.minusWeeks(1)).name).to.eq('Last week');
      expect(esnDatetimeService.getHumanTimeGrouping(targetDate.minusWeeks(2)).name).to.eq('This month');
      expect(esnDatetimeService.getHumanTimeGrouping(targetDate.minusMonths(1)).name).to.eq('Last month');
      expect(esnDatetimeService.getHumanTimeGrouping(targetDate.minusMonths(3)).name).to.eq('This year');
      expect(esnDatetimeService.getHumanTimeGrouping(targetDate.minusYears(3)).name).to.eq('Old messages');
    });
  });
});
