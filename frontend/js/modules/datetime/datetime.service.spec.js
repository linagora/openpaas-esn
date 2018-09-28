'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnDatetimeService', function() {
  var esnDatetimeService, $rootScope;
  var configMock;

  beforeEach(function() {
    module('esn.datetime', function($provide) {
      $provide.constant('esnConfig', function() {
        return $q.when(configMock);
      });
    });
  });

  beforeEach(inject(function(_$rootScope_, _esnDatetimeService_) {
    $rootScope = _$rootScope_;
    esnDatetimeService = _esnDatetimeService_;
  }));

  describe('The init function', function() {
    it('should set the timeformat as 24-hour with config from esnConfig', function() {
      var date = new Date(2017, 11, 23, 18, 33, 11);

      configMock = {
        use24hourFormat: true
      };

      esnDatetimeService.init();
      $rootScope.$digest();

      expect(esnDatetimeService.format(date, 'time')).to.equal('18:33');
    });

    it('should set the timeformat as 12-hour with config from esnConfig', function() {
      var date = new Date(2017, 11, 23, 18, 33, 11);

      configMock = {
        use24hourFormat: false
      };

      esnDatetimeService.init();
      $rootScope.$digest();

      expect(esnDatetimeService.format(date, 'time')).to.equal('6:33 PM');
    });
  });

  describe('The format function', function() {
    it('should support mediumDate format', function() {
      var date = new Date('6/5/17');

      expect(esnDatetimeService.format(date, 'mediumDate')).to.equal('Jun 5, 2017');
    });

    it('should support shortDate format', function() {
      var date = new Date('Jun 5, 2017');

      expect(esnDatetimeService.format(date, 'shortDate')).to.equal('6/5/17');
    });

    it('should support fullDate format', function() {
      var date = new Date('Jun 5, 2017');

      expect(esnDatetimeService.format(date, 'fullDate')).to.equal('Monday, June 5, 2017');
    });

    it('should support longDate format', function() {
      var date = new Date('Jun 5, 2017');

      expect(esnDatetimeService.format(date, 'longDate')).to.equal('June 5, 2017');
    });

    it('should support both date and 12-hour time format', function() {
      configMock = {
        use24hourFormat: false
      };
      var date = new Date(2017, 11, 23, 18, 33, 11);

      esnDatetimeService.init();
      $rootScope.$digest();

      expect(esnDatetimeService.format(date, 'mediumDate time')).to.equal('Dec 23, 2017 6:33 PM');
    });

    it('should support both date and 24-hour time format', function() {
      configMock = {
        use24hourFormat: true
      };
      var date = new Date(2017, 11, 23, 18, 33, 11);

      esnDatetimeService.init();
      $rootScope.$digest();

      expect(esnDatetimeService.format(date, 'mediumDate time')).to.equal('Dec 23, 2017 18:33');
    });

    it('should detect valid formats from input string and format correctly', function() {
      configMock = {
        use24hourFormat: true
      };
      var date = new Date(2017, 11, 23, 18, 33, 11);

      esnDatetimeService.init();
      $rootScope.$digest();

      expect(esnDatetimeService.format(date, 'current Time of full-date is time-fullDate')).to.equal('current Time of full-date is 18:33-Saturday, December 23, 2017');
    });

    it('should return formatted date if input is instance of date', function() {
      var date = new Date('6/5/17');

      expect(esnDatetimeService.format(date, 'mediumDate')).to.equal('Jun 5, 2017');
    });

    it('should return formatted date if input is a date string value', function() {
      var date = '6/5/17';

      expect(esnDatetimeService.format(date, 'mediumDate')).to.equal('Jun 5, 2017');
    });

    it('should return original value if input is string which is unrecognised date value', function() {
      var date = 'unrecognised';

      expect(esnDatetimeService.format(date, 'mediumDate')).to.equal('unrecognised');
    });
  });

});
