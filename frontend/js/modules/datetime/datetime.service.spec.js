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

  describe('The formatDate function', function() {
    it('should return formatted date if input is instance of date', function() {
      var date = new Date('6/5/17');

      expect(esnDatetimeService.formatDate(date, 'date')).to.equal('05/06/2017');
    });

    it('should return formatted date if input is string which is recognised date value', function() {
      var date = '6/5/17';

      expect(esnDatetimeService.formatDate(date, 'date')).to.equal('05/06/2017');
    });

    it('should return original value if input is string which is unrecognised date value', function() {
      var date = 'unrecognised';

      expect(esnDatetimeService.formatDate(date, 'date')).to.equal('unrecognised');
    });
  });

  describe('The init function', function() {
    it('should set the datetime format with config from esnConfig', function() {
      var date = new Date(2017, 11, 23, 18, 33, 11);

      configMock = {
        dateFormat: 'EEEE, MMMM d, y',
        timeFormat: 'H:mm'
      };

      esnDatetimeService.init();
      $rootScope.$digest();

      expect(esnDatetimeService.formatDate(date)).to.equal('Saturday, December 23, 2017 18:33');
      expect(esnDatetimeService.formatDate(date, 'time')).to.equal('18:33');
      expect(esnDatetimeService.formatDate(date, 'date')).to.equal('Saturday, December 23, 2017');
    });
  });
});
