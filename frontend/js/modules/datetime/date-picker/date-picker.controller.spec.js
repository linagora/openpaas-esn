'use strict';

/* global chai, sinon: true */

var expect = chai.expect;

describe('The esnDatetimeDatePickerController function', function() {
  var $controller, $rootScope, $scope, esnDatetimeService, moment, $element;

  beforeEach(function() {
    module('esn.datetime');

    module(function($provide) {
      $provide.value('$element', function() {
        return $element;
      });
    });

    inject(function(_$controller_, _$rootScope_, _$timeout_, _esnDatetimeService_, _moment_, _$element_) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      esnDatetimeService = _esnDatetimeService_;
      esnDatetimeService.updateObjectToUserTimeZone = sinon.stub().returnsArg(0);
      esnDatetimeService.updateObjectToBrowserTimeZone = sinon.stub().returnsArg(0);
      $element = _$element_;
      $element.find = sinon.stub().returnsArg(0);
      moment = _moment_;
    });
  });

  function initController(bindings) {
    $scope = $rootScope.$new();

    var controller = $controller('esnDatetimeDatePickerController', { $scope: $scope }, bindings);

    $scope.$digest();

    return controller;
  }

  describe('The onInit fn', function() {
    it('should set a new value to $ctrl.uiValue based on ngModel', function() {
      var initialMoment = moment('2020-06-08T12:00:00.000Z');
      var controller = initController();
      controller.ngModel = initialMoment;
      controller.$onInit();
      expect(controller.uiValue).to.deep.equal(initialMoment);
    });
  });

  describe('The onChange fn', function() {
    it('should change ngModel according to $ctrl.uiValue', function() {
      var initialMoment = moment('2020-06-08T12:00:00.000Z');
      var controller = initController();
      controller.uiValue = initialMoment;
      controller.onChange();
      expect(controller.ngModel).to.deep.equal(initialMoment);
    });
  });
});
