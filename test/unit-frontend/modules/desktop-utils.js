'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.desktop-utils angular module', function() {
  var element, $scope, $compile, isMobile;

  beforeEach(function() {

  });

  beforeEach(function() {
    angular.mock.module('esn.desktop-utils', function($provide) {
      isMobile = false;

      $provide.value('deviceDetector', { isMobile: function() { return isMobile; }});
    });
  });

  beforeEach(angular.mock.inject(function(_$compile_, _$rootScope_) {
    $compile = _$compile_;
    $scope = _$rootScope_.$new();
  }));

  function compile(html) {
    element = $compile(html)($scope);
    $scope.$digest();
  }

  describe('The desktopClick directive', function() {

    it('should stop immediate propagation', function(done) {
      var event = {
        type: 'click',
        stopImmediatePropagation: done
      };

      compile('<div desktop-click="clicked = true" />');
      element.triggerHandler(event);
    });

    it('should prevent default behaviour', function(done) {
      var event = {
        type: 'click',
        stopImmediatePropagation: angular.noop,
        preventDefault: done
      };

      compile('<div desktop-click="clicked = true" />');
      element.triggerHandler(event);
    });

    it('should register an on-click event listener if we are on desktop', function() {
      compile('<div desktop-click="clicked = true" />');
      element.click();

      expect($scope.clicked).to.equal(true);
    });

    it('should pass the event as "event" to the angular expression', function() {
      compile('<div desktop-click="clicked = event" />');
      element.click();

      expect($scope.clicked.preventDefault).to.be.a('function');
    });

    it('should not register an on-click event listener if we are not on desktop', function() {
      isMobile = true;

      compile('<div desktop-click="clicked = true" />');
      element.click();

      expect($scope.clicked).to.equal(undefined);
    });

  });

  describe('The desktopHover directive', function() {

    it('should pass "hover=true" to the angular expression if the mouse is over', function() {
      compile('<div desktop-hover="isHover = hover" />');
      element.trigger('mouseenter');

      expect($scope.isHover).to.equal(true);
    });

    it('should pass "hover=false" to the angular expression if the mouse is out', function() {
      compile('<div desktop-hover="isHover = hover" />');
      element.trigger('mouseleave');

      expect($scope.isHover).to.equal(false);
    });

    it('should not register an on-hover event listener if we are not on desktop', function() {
      isMobile = true;

      compile('<div desktop-hover="isHover = true" />');
      element.trigger('mouseenter');

      expect($scope.isHover).to.equal(undefined);
    });

  });

});
