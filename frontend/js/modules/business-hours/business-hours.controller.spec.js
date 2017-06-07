'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnBusinessHoursController', function() {

  var $controller, $rootScope, $scope, DEFAULT_BUSINESS_HOURS;

  beforeEach(function() {
    module('esn.business-hours');

    inject(function(_$controller_, _$rootScope_, ESN_CONFIG_DEFAULT) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      DEFAULT_BUSINESS_HOURS = ESN_CONFIG_DEFAULT.core.businessHours;
    });
  });

  function initController(scope) {
    $scope = scope || $rootScope.$new();

    var controller = $controller('esnBusinessHoursController', { $scope: $scope });

    $scope.$digest();

    return controller;
  }

  describe('The $onInit fn', function() {
    it('should initialize businessHours if it is not available', function() {
      var controller = initController();

      controller.businessHours = null;
      controller.$onInit();

      expect(controller.businessHours).to.deep.equal(DEFAULT_BUSINESS_HOURS);
    });

    it('should initialize businessHours if it is empty', function() {
      var controller = initController();

      controller.businessHours = [];
      controller.$onInit();

      expect(controller.businessHours).to.deep.equal(DEFAULT_BUSINESS_HOURS);
    });
  });
});
