'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The EsnShortcutsSheetController', function() {

  var $rootScope, $scope, $controller;
  var esnShortcutsRegistry;
  var ESN_SHORTCUTS_DEFAULT_CATEGORY;

  beforeEach(function() {
    module('esn.shortcuts');

    inject(function(
      _$rootScope_,
      _$controller_,
      _esnShortcutsRegistry_,
      _ESN_SHORTCUTS_DEFAULT_CATEGORY_
    ) {
      $rootScope = _$rootScope_;
      $controller = _$controller_;
      esnShortcutsRegistry = _esnShortcutsRegistry_;
      ESN_SHORTCUTS_DEFAULT_CATEGORY = _ESN_SHORTCUTS_DEFAULT_CATEGORY_;
    });
  });

  function initController(scope) {
    $scope = scope || $rootScope.$new();

    var controller = $controller('EsnShortcutsSheetController', { $scope: $scope });

    $scope.$digest();

    return controller;
  }

  describe('The $onInit function', function() {
    it('should build the categories with all shortcuts registered', function() {
      var controller = initController();
      var shortcut1 = {
        id: 'shortcut1',
        combo: 'x',
        description: 'this is shortcut1'
      };
      var shortcut2 = {
        id: 'shortcut2',
        combo: 'x',
        description: 'this is shortcut2'
      };

      esnShortcutsRegistry.register(shortcut1);
      esnShortcutsRegistry.register(shortcut2);
      controller.$onInit();

      expect(controller.categories).to.deep.equal([{
        id: ESN_SHORTCUTS_DEFAULT_CATEGORY.id,
        name: ESN_SHORTCUTS_DEFAULT_CATEGORY.name,
        shortcuts: [shortcut1, shortcut2]
      }]);
    });
  });
});
