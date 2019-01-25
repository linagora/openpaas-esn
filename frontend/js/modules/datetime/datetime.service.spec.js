'use strict';

/* global chai */

var expect = chai.expect;

describe('The esnDatetimeService', function() {
  var $rootScope;
  var esnDatetimeService;

  beforeEach(function() {
    module('esn.datetime');
    module('esn.configuration');

    module(function($provide) {
      $provide.constant('esnConfig', function(argument) {
        if (argument === 'core.language') {
          return $q.when('en');
        }

        return $q.when({timeZone: 'Europe/Berlin'});
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
});
