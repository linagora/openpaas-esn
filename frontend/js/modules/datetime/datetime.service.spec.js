'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The esnDatetimeService', function() {
  var $rootScope;
  var esnDatetimeService;
  var ESN_DATETIME_TIME_FORMATS, ESN_DATETIME_DATE_FORMATS_MOCK;
  var datetimeConfigMock, momentMock, languageConfigMock;

  beforeEach(function() {
    ESN_DATETIME_DATE_FORMATS_MOCK = {
      default: {
        shortDate: 'shortDate',
        mediumDate: 'mediumDateY',
        longDate: 'longDate',
        fullDate: 'fullDate'
      }
    };
    momentMock = {};
    datetimeConfigMock = {};

    module('esn.datetime');
    module('esn.configuration');

    module(function($provide) {
      $provide.constant('esnConfig', function(argument) {
        if (argument === 'core.language') {
          return languageConfigMock;
        }

        return $q.when(datetimeConfigMock);
      });
      $provide.constant('ESN_DATETIME_DATE_FORMATS', ESN_DATETIME_DATE_FORMATS_MOCK);
      $provide.constant('moment', momentMock);
    });
  });

  beforeEach(function() {
    inject(function(
      _$rootScope_,
      _esnDatetimeService_,
      _ESN_DATETIME_TIME_FORMATS_
    ) {
      $rootScope = _$rootScope_;
      esnDatetimeService = _esnDatetimeService_;
      ESN_DATETIME_TIME_FORMATS = _ESN_DATETIME_TIME_FORMATS_;
    });
  });

  describe('The init function', function() {
    it('should get locale to set moment locale', function() {
      languageConfigMock = 'locale';
      momentMock.locale = sinon.spy();

      esnDatetimeService.init();
      $rootScope.$digest();

      expect(momentMock.locale).to.have.been.calledWith(languageConfigMock);
    });
  });

  describe('The format function', function() {
    beforeEach(function() {
      languageConfigMock = 'default';
      datetimeConfigMock = {
        timeZone: 'timeZone'
      };
      momentMock.locale = function() {};
    });

    it('should support mediumDate format', function() {
      var date = new Date('6/5/17');
      var formatMock = sinon.spy();

      esnDatetimeService.init();
      $rootScope.$digest();

      momentMock.tz = sinon.spy(function() {
        return {
          format: formatMock
        };
      });

      esnDatetimeService.format(date, 'mediumDate');

      expect(momentMock.tz).to.have.been.calledWith(date, datetimeConfigMock.timeZone);
      expect(formatMock).to.have.been.calledWith(ESN_DATETIME_DATE_FORMATS_MOCK[languageConfigMock].mediumDate);
    });

    it('should support shortDate format', function() {
      var date = new Date('Jun 5, 2017');
      var formatMock = sinon.spy();

      esnDatetimeService.init();
      $rootScope.$digest();

      momentMock.tz = sinon.spy(function() {
        return {
          format: formatMock
        };
      });

      esnDatetimeService.format(date, 'shortDate');

      expect(momentMock.tz).to.have.been.calledWith(date, datetimeConfigMock.timeZone);
      expect(formatMock).to.have.been.calledWith(ESN_DATETIME_DATE_FORMATS_MOCK[languageConfigMock].shortDate);
    });

    it('should support fullDate format', function() {
      var date = new Date('Jun 5, 2017');
      var formatMock = sinon.spy();

      esnDatetimeService.init();
      $rootScope.$digest();

      momentMock.tz = sinon.spy(function() {
        return {
          format: formatMock
        };
      });

      esnDatetimeService.format(date, 'fullDate');

      expect(momentMock.tz).to.have.been.calledWith(date, datetimeConfigMock.timeZone);
      expect(formatMock).to.have.been.calledWith(ESN_DATETIME_DATE_FORMATS_MOCK[languageConfigMock].fullDate);
    });

    it('should support longDate format', function() {
      var date = new Date('Jun 5, 2017');
      var formatMock = sinon.spy();

      esnDatetimeService.init();
      $rootScope.$digest();

      momentMock.tz = sinon.spy(function() {
        return {
          format: formatMock
        };
      });

      esnDatetimeService.format(date, 'longDate');

      expect(momentMock.tz).to.have.been.calledWith(date, datetimeConfigMock.timeZone);
      expect(formatMock).to.have.been.calledWith(ESN_DATETIME_DATE_FORMATS_MOCK[languageConfigMock].longDate);
    });

    it('should support both date and 12-hour time format', function() {
      datetimeConfigMock.use24hourFormat = false;
      var date = new Date(2017, 11, 23, 18, 33, 11);
      var formatMock = sinon.spy();

      esnDatetimeService.init();
      $rootScope.$digest();

      momentMock.tz = sinon.spy(function() {
        return {
          format: formatMock
        };
      });

      esnDatetimeService.format(date, 'mediumDate time');

      expect(momentMock.tz).to.have.been.calledWith(date, datetimeConfigMock.timeZone);
      expect(formatMock).to.have.been.calledTwice;
      expect(formatMock).to.have.been.calledWith(ESN_DATETIME_DATE_FORMATS_MOCK[languageConfigMock].mediumDate);
      expect(formatMock).to.have.been.calledWith(ESN_DATETIME_TIME_FORMATS.format12);
    });

    it('should support both date and 24-hour time format', function() {
      datetimeConfigMock.use24hourFormat = true;
      var date = new Date(2017, 11, 23, 18, 33, 11);
      var formatMock = sinon.spy();

      esnDatetimeService.init();
      $rootScope.$digest();

      momentMock.tz = sinon.spy(function() {
        return {
          format: formatMock
        };
      });

      esnDatetimeService.format(date, 'mediumDate time');

      expect(momentMock.tz).to.have.been.calledWith(date, datetimeConfigMock.timeZone);
      expect(formatMock).to.have.been.calledTwice;
      expect(formatMock).to.have.been.calledWith(ESN_DATETIME_DATE_FORMATS_MOCK[languageConfigMock].mediumDate);
      expect(formatMock).to.have.been.calledWith(ESN_DATETIME_TIME_FORMATS.format24);
    });

    it('should detect valid formats from input string', function() {
      datetimeConfigMock.use24hourFormat = true;
      var date = new Date(2017, 11, 23, 18, 33, 11);
      var formatMock = sinon.spy();

      esnDatetimeService.init();
      $rootScope.$digest();

      momentMock.tz = sinon.spy(function() {
        return {
          format: formatMock
        };
      });

      esnDatetimeService.format(date, 'current Time of full-date is time-fullDate');

      expect(momentMock.tz).to.have.been.calledWith(date, datetimeConfigMock.timeZone);
      expect(formatMock).to.have.been.calledTwice;
      expect(formatMock).to.have.been.calledWith(ESN_DATETIME_DATE_FORMATS_MOCK[languageConfigMock].fullDate);
      expect(formatMock).to.have.been.calledWith(ESN_DATETIME_TIME_FORMATS.format24);
    });

    it('should format date if input is instance of date', function() {
      var date = new Date('6/5/17');
      var formatMock = sinon.spy();

      esnDatetimeService.init();
      $rootScope.$digest();

      momentMock.tz = sinon.spy(function() {
        return {
          format: formatMock
        };
      });

      esnDatetimeService.format(date, 'mediumDate');

      expect(momentMock.tz).to.have.been.calledWith(date, datetimeConfigMock.timeZone);
      expect(formatMock).to.have.been.calledWith(ESN_DATETIME_DATE_FORMATS_MOCK[languageConfigMock].mediumDate);
    });

    it('should format date if input is a date string value', function() {
      var date = '6/5/17';
      var formatMock = sinon.spy();

      esnDatetimeService.init();
      $rootScope.$digest();

      momentMock.tz = sinon.spy(function() {
        return {
          format: formatMock
        };
      });

      esnDatetimeService.format(date, 'mediumDate');

      expect(momentMock.tz).to.have.been.calledWith(new Date(date), datetimeConfigMock.timeZone);
      expect(formatMock).to.have.been.calledWith(ESN_DATETIME_DATE_FORMATS_MOCK[languageConfigMock].mediumDate);
    });
  });
});
