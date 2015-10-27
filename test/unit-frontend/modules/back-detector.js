'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.back-detector Angular module', function() {

  var $rootScope, $scope, $compile, BACK_BTN_EVENT;

  function goBack() {
    $rootScope.$emit('$locationChangeSuccess', '/next', '/previous');
    $rootScope.$emit('$locationChangeStart', '/previous', '/next');
  }

  beforeEach(angular.mock.module('esn.back-detector'));

  beforeEach(inject(function(_$rootScope_, _$compile_, _BACK_BTN_EVENT_) {
    $rootScope = _$rootScope_;
    $scope = _$rootScope_.$new();
    $compile = _$compile_;
    BACK_BTN_EVENT = _BACK_BTN_EVENT_;
  }));

  it('should broadcast an event when the user goes "back", passing the locationChange event', function(done) {
    var unregister = $scope.$on(BACK_BTN_EVENT, function(event, data) {
      expect(data.locationChangeEvent.preventDefault).to.be.a('function');

      unregister();
      done();
    });

    goBack();
  });

  describe('The onBack directive', function() {

    function compileDirective(html) {
      $compile(html)($scope);
      $scope.$digest();
    }

    it('should call on-back fn when the user goes back', function() {
      var callCount = 0;
      $scope.back = function() {
        callCount++;
      };
      compileDirective('<div on-back="back()">');
      goBack();

      expect(callCount).to.equal(1);
    });

  });

});
