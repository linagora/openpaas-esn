'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnBusinessHoursWorkingHoursController', function() {

  var $controller, $rootScope, $scope, esnDatetimeService;

  beforeEach(function() {
    module('esn.business-hours', function($provide) {
      $provide.value('esnDatetimeService', esnDatetimeService);
    });

    inject(function(
      _$controller_,
      _$rootScope_,
      _esnDatetimeService_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      esnDatetimeService = _esnDatetimeService_;
    });
  });

  function initController(scope) {
    $scope = scope || $rootScope.$new();

    var controller = $controller('esnBusinessHoursWorkingHoursController', { $scope: $scope });

    controller.start = '8:18';
    controller.end = '9:19';
    controller.$onInit();

    $scope.$digest();

    return controller;
  }

  describe('The $onInit fn', function() {
    it('should expose display as moment objects', function() {
      var controller = initController();

      expect(controller.display.start.hours()).to.equal(8);
      expect(controller.display.start.minutes()).to.equal(18);
      expect(controller.display.end.hours()).to.equal(9);
      expect(controller.display.end.minutes()).to.equal(19);
    });
  });

  describe('The onStartChange fn', function() {
    it('should update the start value to match the display one', function() {
      var controller = initController();

      controller.display.start.hour(7).minute(17);
      controller.onStartChange();

      expect(controller.start).to.equal('7:17');
    });

    it('should update the end value to equal start value when the user selects start after end', function() {
      var controller = initController();

      controller.display.start.hour(10).minute(10);
      controller.onStartChange();

      expect(controller.start).to.equal('10:10');
      expect(controller.end).to.equal('10:10');
    });
  });

  describe('The onEndChange fn', function() {
    it('should update the end value to match the display one', function() {
      var controller = initController();

      controller.display.end.hour(10).minute(10);
      controller.onEndChange();

      expect(controller.end).to.equal('10:10');
    });

    it('should update the start value to equal end value when the user selects end before start', function() {
      var controller = initController();

      controller.display.end.hour(7).minute(17);
      controller.onEndChange();

      expect(controller.start).to.equal('7:17');
      expect(controller.end).to.equal('7:17');
    });
  });
});
