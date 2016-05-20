'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.settings-overlay Angular module', function() {

  var $rootScope, $scope, $compile, element;

  function compileDirective(html) {
    element = $compile(html)($scope);
    $scope.$digest();

    element.appendTo(document.body);
  }

  beforeEach(function() {
    angular.mock.module('esn.settings-overlay');
    angular.mock.module('jadeTemplates');
  });

  beforeEach(inject(function(_$rootScope_, _$compile_) {
    $rootScope = _$rootScope_;
    $scope = _$rootScope_.$new();
    $compile = _$compile_;
  }));

  describe('The settingsOverlaySref directive', function() {

    afterEach(function() {
      element.remove();
    });

    it('should append a .settings-overlay element to the DOM, hidden by default', function() {
      compileDirective('<div settings-overlay-sref="/ui/router/state" />');

      expect(element.find('.settings-overlay')).to.have.length(1);
      expect(element.find('.settings-overlay:visible')).to.have.length(0);
    });

    it('should use the sref as a ui-sref attribute on the overlay', function() {
      compileDirective('<div settings-overlay-sref="/ui/router/state" />');

      expect(element.find('.settings-overlay').attr('ui-sref')).to.equal('/ui/router/state');
    });

    it('should make the .settings-overlay element visible on mouseover', function() {
      compileDirective('<div settings-overlay-sref="/ui/router/state" />');

      element.trigger('mouseover');

      expect(element.find('.settings-overlay:visible')).to.have.length(1);
    });

    it('should not make the .settings-overlay element visible on mouseover if user is dragging something', function() {
      compileDirective('<div settings-overlay-sref="/ui/router/state" />');

      $rootScope.esnIsDragging = true;
      element.trigger('mouseover');

      expect(element.find('.settings-overlay:visible')).to.have.length(0);
    });

    it('should make the .settings-overlay element hidden on mouseout', function() {
      compileDirective('<div settings-overlay-sref="/ui/router/state" />');

      element.trigger('mouseover').trigger('mouseout');

      expect(element.find('.settings-overlay:visible')).to.have.length(0);
    });

    it('should not trigger click in parent element when clicked', function() {
      $scope.parentClicked = false;
      compileDirective('<div ng-click="parentClicked = true" settings-overlay-sref="/ui/router/state" />');

      element.find('.settings-overlay').click();

      expect($scope.parentClicked).to.equal(false);
    });

  });

});
