'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The box-overlay Angular module', function() {

  beforeEach(module('jadeTemplates'));

  beforeEach(function() {
    angular.mock.module('esn.box-overlay');
  });

  describe('boxOverlay directive', function() {

    var $compile, $rootScope, $scope, $httpBackend, element;

    beforeEach(inject(function(_$compile_, _$rootScope_, _$httpBackend_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $httpBackend = _$httpBackend_;
    }));

    afterEach(function() {
      overlays().remove(); // Removes all overlays that might have been left in the DOM
    });

    function compileAndClickTheButton(html) {
      element = $compile(html)($scope);

      element.click();
      $rootScope.$digest();
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

  });

});
