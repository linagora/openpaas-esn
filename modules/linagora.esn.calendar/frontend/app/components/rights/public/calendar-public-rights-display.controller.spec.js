'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The CalPublicRightsDisplayController controller', function() {
  var $rootScope,
    $scope,
    $controller,
    CalCalendarRightsUtilsService;

  beforeEach(function() {
    angular.mock.module('esn.calendar');
    angular.mock.inject(function(_$rootScope_, _$controller_, _CalCalendarRightsUtilsService_) {
      $rootScope = _$rootScope_;
      $controller = _$controller_;
      CalCalendarRightsUtilsService = _CalCalendarRightsUtilsService_;
      $scope = $rootScope.$new();
    });
  });

  function initController(bindings) {
    return $controller('CalPublicRightsDisplayController', {$scope: $scope}, bindings);
  }

  describe('The $onInit function', function() {
    it('should set the humanReadable property', function() {
      var right = 'This is a right';
      var spy = sinon.spy(CalCalendarRightsUtilsService, 'asHumanReadable');
      var controller = initController({right: right});

      controller.$onInit();

      expect(spy).to.have.been.calledWith(right);
      expect(controller.humanReadable).to.be.defined;
    });
  });
});
