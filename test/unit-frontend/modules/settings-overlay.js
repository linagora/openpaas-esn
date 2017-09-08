'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.settings-overlay Angular module', function() {

  var $scope, $compile, element;

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
    $scope = _$rootScope_.$new();
    $compile = _$compile_;
  }));

  describe('The settingsOverlay directive', function() {

    afterEach(function() {
      element.remove();
    });

    it('should not trigger click in parent element when clicked', function() {
      $scope.parentClicked = false;
      compileDirective('<settings-overlay ng-click="parentClicked = true" />');

      element.find('settings-overlay').click();

      expect($scope.parentClicked).to.equal(false);
    });

    it('should contain a md-menu', function() {
      compileDirective('<settings-overlay/>');

      expect(element.find('md-menu')).to.exist;
    });

    it('should contain a clickable icon', function() {
      compileDirective('<settings-overlay/>');

      expect(element.find('.mdi-dots-vertical')).to.exist.and.attr('ng-click').to.equal('ctrl.openMenu($mdMenu, $event)');
    });
  });

});
