'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The box-overlay Angular module', function() {

  beforeEach(module('jadeTemplates'));

  beforeEach(function() {
    angular.mock.module('esn.box-overlay');
  });

  describe('boxOverlay directive', function() {

    var $compile, $rootScope, $scope, $httpBackend, $timeout, element;

    beforeEach(inject(function(_$compile_, _$rootScope_, _$httpBackend_, _$timeout_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $httpBackend = _$httpBackend_;
      $timeout = _$timeout_;
    }));

    afterEach(function() {
      overlays().remove(); // Removes all overlays that might have been left in the DOM
    });

    function compileAndClickTheButton(html) {
      element = $compile(html)($scope);
      return clickTheButton(element);
    }

    function clickTheButton(button) {
      button.click();
      $rootScope.$digest();
      return button;
    }

    function closeFirstBox() {
      var closeButtons = angular.element('.box-overlay-open i.close');
      var closeButton = angular.element(closeButtons[0]);
      closeButton.triggerHandler('click');
      $timeout.flush();
    }

    function overlays() {
      return angular.element('.box-overlay-open');
    }

    it('should display the overlay when the calling element is clicked', function() {
      compileAndClickTheButton('<button box-overlay />');

      expect(overlays()).to.have.length(1);
    });

    it('should remove the overlay when the calling element\'s scope is destroyed, if auto-destroy=true', function() {
      compileAndClickTheButton('<button box-overlay box-auto-destroy="true" />');
      $scope.$destroy();

      expect(overlays()).to.have.length(0);
    });

    it('should not remove the overlay when the calling element\'s scope is destroyed, if auto-destroy=false', function() {
      compileAndClickTheButton('<button box-overlay />');
      $scope.$destroy();

      expect(overlays()).to.have.length(1);
    });

    it('should correctly fetch a custom template, and add it to the overlay', function() {
      $httpBackend.expectGET('/path/to/the/template').respond('<div class="i-am-the-template">Test</div>');

      compileAndClickTheButton('<button box-overlay box-template-url="/path/to/the/template" />');
      $httpBackend.flush();

      expect(overlays().find('.i-am-the-template')).to.have.length(1);
    });

    it('should display the title in the overlay', function() {
      compileAndClickTheButton('<button box-overlay box-title="The title !" />');

      expect(overlays().find('.panel-title').text()).to.match(/The title !/);
    });

    it('should not try to focus when no element has the autofocus attr in the template', function() {
      $httpBackend.expectGET('/path/to/the/template').respond('<div class="i-am-the-template">Test</div>');

      compileAndClickTheButton('<button box-overlay box-template-url="/path/to/the/template" />');
      $httpBackend.flush();
      $timeout.flush();

      expect(overlays().find('.i-am-the-template')).to.have.length(1);
    });

    it('should focus an autofocus element found in the template', function() {
      $httpBackend.expectGET('/path/to/the/template').respond('<input class="i-am-the-template" autofocus>Test</input>');

      compileAndClickTheButton('<button box-overlay box-template-url="/path/to/the/template" />');
      $httpBackend.flush();
      $timeout.flush();

      expect(overlays().find('.i-am-the-template')[0]).to.equal(document.activeElement);
    });

    it('should focus the autofocus element of a newly shown overlay', function() {
      $httpBackend.expectGET('/path/to/the/template').respond('<input class="i-am-the-template" autofocus>Test</input>');
      compileAndClickTheButton('<button box-overlay box-template-url="/path/to/the/template" />');
      $httpBackend.flush();
      $timeout.flush();

      $httpBackend.expectGET('/path/to/another/template').respond('<input class="i-am-another-template" autofocus>Test</input>');
      compileAndClickTheButton('<button box-overlay box-template-url="/path/to/another/template" />');
      $httpBackend.flush();
      $timeout.flush();

      expect(overlays().find('.i-am-another-template')[0]).to.equal(document.activeElement);
    });

    it('should accept to open two boxes', function() {

      var notificationCount = 0;
      $rootScope.$on('box-overlay:no-space-left-on-screen', function() {
        notificationCount++;
      });

      var button = compileAndClickTheButton('<button box-overlay />');
      clickTheButton(button);

      expect(overlays()).to.have.length(2);
      expect(notificationCount).to.equal(1);
    });

    it('should not accept to have three boxes', function() {
      var button = compileAndClickTheButton('<button box-overlay />');
      clickTheButton(button);
      clickTheButton(button);

      expect(overlays()).to.have.length(2);
    });

    it('should accept to reopen a box when one has been closed', function() {
      var notificationCount = 0;
      $rootScope.$on('box-overlay:space-left-on-screen', function() {
        notificationCount++;
      });

      var button = compileAndClickTheButton('<button box-overlay />');
      clickTheButton(button);
      closeFirstBox();
      clickTheButton(button);

      expect(overlays()).to.have.length(2);
      expect(notificationCount).to.equal(1);
    });

  });

});
