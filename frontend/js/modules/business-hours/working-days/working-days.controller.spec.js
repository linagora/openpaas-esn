'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnBusinessHoursWorkingDaysController', function() {

  var $controller, $rootScope, $scope;

  beforeEach(function() {
    module('esn.business-hours');

    inject(function(_$controller_, _$rootScope_) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
    });
  });

  function initController(scope) {
    $scope = scope || $rootScope.$new();

    var controller = $controller('esnBusinessHoursWorkingDaysController', { $scope: $scope });

    $scope.$digest();

    return controller;
  }

  describe('The $onInit fn', function() {
    it('should expose days array to display selected days', function() {
      var controller = initController();

      controller.daysOfWeek = [1, 2, 3];
      controller.$onInit();

      expect(controller.days).to.deep.equal([{
        value: 1,
        title: 'Monday',
        selected: true
      }, {
        value: 2,
        title: 'Tuesday',
        selected: true
      }, {
        value: 3,
        title: 'Wednesday',
        selected: true
      }, {
        value: 4,
        title: 'Thursday',
        selected: false
      }, {
        value: 5,
        title: 'Friday',
        selected: false
      }, {
        value: 6,
        title: 'Saturday',
        selected: false
      }, {
        value: 0,
        title: 'Sunday',
        selected: false
      }]);
    });
  });

  describe('The onDayChange fn', function() {
    it('should update daysOfWeek with selected days', function() {
      var controller = initController();

      controller.days = [{
        value: 1,
        selected: true
      }, {
        value: 2,
        selected: false
      }];
      controller.onDayChange();

      expect(controller.daysOfWeek).to.deep.equal([1]);
    });
  });

});
