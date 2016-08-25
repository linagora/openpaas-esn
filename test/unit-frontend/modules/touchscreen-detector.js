'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The touchscreenDetector service', function() {
  var $window, touchscreenDetectorService;

  beforeEach(module('esn.touchscreen-detector'));

  beforeEach(inject(function(_$window_, _touchscreenDetectorService_) {
    $window = _$window_;
    touchscreenDetectorService = _touchscreenDetectorService_;
  }));

  describe('the hasTouchscreen function', function() {

    it('should return true if $window maxTouchPoints is > 0', function() {
      $window.navigator.maxTouchPoints = 1;
      $window.navigator.msMaxTouchPoints = 1;

      expect(touchscreenDetectorService.hasTouchscreen()).to.be.true;
    });

    it('should return false if $window maxTouchPoints is 0', function() {
      $window.navigator.maxTouchPoints = 0;
      $window.navigator.msMaxTouchPoints = 0;

      expect(touchscreenDetectorService.hasTouchscreen()).to.be.false;
    });
  });
});
