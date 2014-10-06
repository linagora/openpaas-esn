'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.user-notification Angular module', function() {
  beforeEach(function() {
    angular.mock.module('esn.user-notification');
  });

  describe('userNotificationPopover directive', function() {
    var portraitWidth = 360;
    var landscapeWidth = 640;
    var portraitInnerHeight = 615;
    var portraitInnerHeightUrlBar = 559;
    var portraitScreenHeight = 640;
    //var landscapeInnerHeight = 335;
    var landscapeInnerHeightUrlBar = 279;
    var landscapeScreenHeight = 360;

    var $window = {
      innerWidth: portraitWidth,
      innerHeight: portraitInnerHeightUrlBar,
      outerWidth: portraitWidth,
      outerHeight: portraitInnerHeightUrlBar,
      screen: {
        availWidth: portraitWidth,
        availHeight: portraitScreenHeight
      }
    };

    beforeEach(function() {
      angular.mock.module(function($provide) {
        $provide.value('$window', $window);
      });
      angular.mock.inject(function($compile, $rootScope, $timeout) {
        this.$compile = $compile;
        this.$rootScope = $rootScope;
        this.$timeout = $timeout;
      });
    });

    it('should take all width in portrait format and landscape when resizing', function() {
      $window.innerWidth = portraitWidth;
      $window.innerHeight = portraitInnerHeightUrlBar;
      $window.outerWidth = portraitWidth;
      $window.outerHeight = portraitInnerHeightUrlBar;
      $window.screen.availWidth = portraitWidth;
      $window.screen.availHeight = portraitScreenHeight;
      var html = '<div ng-controller="userNotificationController"><div id="test" user-notification-popover></div></div>';
      var element = this.$compile(html)(this.$rootScope);
      this.$rootScope.$digest();
      var divElement = element.find('#test');
      expect(divElement.width()).to.equal(portraitWidth - 10);
      this.$timeout.flush();

      // Resize the screen
      $window.innerWidth = landscapeWidth;
      $window.innerHeight = landscapeInnerHeightUrlBar;
      $window.outerWidth = landscapeWidth;
      $window.outerHeight = landscapeInnerHeightUrlBar;
      $window.screen.availWidth = landscapeWidth;
      $window.screen.availHeight = landscapeScreenHeight;
      angular.element($window).resize();
      this.$rootScope.$digest();
      this.$timeout.flush();
      expect(divElement.width()).to.equal(landscapeWidth - 10);
    });

    it('should take all width in portrait format and landscape format ' +
      'even if $window.innerWidth return a value greater than the screen width but ' +
      '$window.outerWidth return the correct value', function() {
      $window.innerWidth = portraitWidth + 400;
      $window.innerHeight = portraitInnerHeightUrlBar;
      $window.outerWidth = portraitWidth;
      $window.outerHeight = portraitInnerHeightUrlBar;
      $window.screen.availWidth = portraitWidth;
      $window.screen.availHeight = portraitScreenHeight;
      var html = '<div ng-controller="userNotificationController"><div id="test" user-notification-popover></div></div>';
      var element = this.$compile(html)(this.$rootScope);
      this.$rootScope.$digest();
      var divElement = element.find('#test');
      expect(divElement.width()).to.equal(portraitWidth - 10);
      this.$timeout.flush();

      // Resize the screen
      $window.innerWidth = landscapeWidth + 400;
      $window.innerHeight = landscapeInnerHeightUrlBar;
      $window.outerWidth = landscapeWidth;
      $window.outerHeight = landscapeInnerHeightUrlBar;
      $window.screen.availWidth = landscapeWidth;
      $window.screen.availHeight = landscapeScreenHeight;
      angular.element($window).resize();
      this.$rootScope.$digest();
      this.$timeout.flush();
      expect(divElement.width()).to.equal(landscapeWidth - 10);
    });

    it('should not resize the height when the $window.innerHeight change', function() {
      $window.innerWidth = portraitWidth;
      $window.innerHeight = portraitInnerHeightUrlBar;
      $window.outerWidth = portraitWidth;
      $window.outerHeight = portraitInnerHeightUrlBar;
      $window.screen.availWidth = portraitWidth;
      $window.screen.availHeight = portraitScreenHeight;
      var html = '<div ng-controller="userNotificationController"><div id="test" user-notification-popover></div></div>';
      var element = this.$compile(html)(this.$rootScope);
      this.$rootScope.$digest();
      var divElement = element.find('#test');
      var elementHeight = divElement.height();
      this.$timeout.flush();

      // Resize the screen
      $window.innerWidth = portraitWidth;
      $window.innerHeight = portraitInnerHeight;
      $window.outerWidth = portraitWidth;
      $window.outerHeight = portraitInnerHeight;
      $window.screen.availWidth = portraitWidth;
      $window.screen.availHeight = portraitScreenHeight;
      angular.element($window).resize();
      this.$rootScope.$digest();
      this.$timeout.flush();
      expect(divElement.height()).to.equal(elementHeight);
    });
  });
});
