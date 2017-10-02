'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The EsnShortcutsSheetController', function() {
  var $rootScope, $scope, $controller;
  var $state, esnShortcutsRegistry;
  var ESN_SHORTCUTS_DEFAULT_CATEGORY;
  var category1, category2, subCategory;
  var shortcutGlobal, shortcut1, shortcut2, shortcut3;

  beforeEach(function() {
    module('esn.shortcuts');
  });

  beforeEach(function() {
    inject(function(
      _$rootScope_,
      _$controller_,
      _$state_,
      _esnShortcutsRegistry_,
      _ESN_SHORTCUTS_DEFAULT_CATEGORY_
    ) {
      $rootScope = _$rootScope_;
      $controller = _$controller_;
      $state = _$state_;
      esnShortcutsRegistry = _esnShortcutsRegistry_;
      ESN_SHORTCUTS_DEFAULT_CATEGORY = _ESN_SHORTCUTS_DEFAULT_CATEGORY_;
    });
  });

  beforeEach(function() {
    category1 = {
      id: 'category1',
      name: 'category1',
      moduleDetector: /module1/
    };
    category2 = {
      id: 'category2',
      name: 'category2',
      moduleDetector: /module2/
    };
    subCategory = {
      id: 'sub_category',
      name: 'My subcategory',
      moduleDetector: true,
      parentId: ESN_SHORTCUTS_DEFAULT_CATEGORY.id
    };
    shortcutGlobal = {
      id: 'shortcutGlobal',
      combo: 'x',
      description: 'this is global shortcut'
    };
    shortcut1 = {
      id: 'shortcut1',
      combo: 'x',
      description: 'this is shortcut1',
      category: category1.id
    };
    shortcut2 = {
      id: 'shortcut2',
      combo: 'x',
      description: 'this is shortcut2',
      category: category2.id
    };
    shortcut3 = {
      id: 'shortcut3',
      combo: 'x',
      description: 'this is shortcut3',
      category: subCategory.id
    };

    esnShortcutsRegistry.addCategory(category1);
    esnShortcutsRegistry.addCategory(category2);
    esnShortcutsRegistry.addCategory(subCategory);
    esnShortcutsRegistry.register(shortcutGlobal);
    esnShortcutsRegistry.register(shortcut1);
    esnShortcutsRegistry.register(shortcut2);
    esnShortcutsRegistry.register(shortcut3);
  });

  function initController(scope) {
    $scope = scope || $rootScope.$new();

    var controller = $controller('EsnShortcutsSheetController', { $scope: $scope });

    $scope.$digest();

    return controller;
  }

  describe('The $onInit function', function() {
    it('should build the categories, sub-categories with only module and global shortcuts', function() {
      $state.current.name = 'module1.state';
      var controller = initController();
      var category3 = {
        id: 'category3',
        name: 'category3',
        moduleDetector: function() { return true; }
      };
      var shortcut4 = {
        id: 'shortcut4',
        combo: 'x',
        description: 'this is shortcut4',
        category: category3.id
      };

      esnShortcutsRegistry.addCategory(category3);
      esnShortcutsRegistry.register(shortcut4);

      controller.$onInit();
      delete shortcut1.category;
      delete shortcut3.category;
      delete shortcut4.category;

      expect(controller.filteredCategories).to.shallowDeepEqual([{
        id: ESN_SHORTCUTS_DEFAULT_CATEGORY.id,
        name: ESN_SHORTCUTS_DEFAULT_CATEGORY.name,
        shortcuts: [shortcutGlobal],
        subCategories: [{
          id: subCategory.id,
          name: subCategory.name,
          parentId: subCategory.parentId,
          shortcuts: [shortcut3]
        }]
      }, {
        id: category1.id,
        name: category1.name,
        shortcuts: [shortcut1]
      }, {
        id: category3.id,
        name: category3.name,
        shortcuts: [shortcut4]
      }]);
    });
  });

  describe('The showAll function', function() {
    it('should show all registered shortcuts', function() {
      var controller = initController();

      controller.$onInit();
      controller.showAll();
      delete shortcut1.category;
      delete shortcut2.category;
      delete shortcut3.category;

      expect(controller.filteredCategories).to.shallowDeepEqual([{
        id: ESN_SHORTCUTS_DEFAULT_CATEGORY.id,
        name: ESN_SHORTCUTS_DEFAULT_CATEGORY.name,
        shortcuts: [shortcutGlobal],
        subCategories: [{
          id: subCategory.id,
          name: subCategory.name,
          parentId: subCategory.parentId,
          shortcuts: [shortcut3]
        }]
      }, {
        id: category1.id,
        name: category1.name,
        shortcuts: [shortcut1]
      }, {
        id: category2.id,
        name: category2.name,
        shortcuts: [shortcut2]
      }]);
    });
  });
});
