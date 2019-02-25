(function(angular) {
  'use strict';

  angular.module('esn.shortcuts')
    .controller('EsnShortcutsSheetController', EsnShortcutsSheetController);

  function EsnShortcutsSheetController($state, _, esnShortcutsRegistry, hotkeys) {
    var self = this;
    var allCategories = [];

    self.$onInit = $onInit;
    self.showAll = showAll;
    self.isFiltered = true;

    function $onInit() {
      var categories = esnShortcutsRegistry.getTopCategories();
      var subCategories = [];

      allCategories = categories.map(function(category) {
        subCategories = esnShortcutsRegistry.getSubCategoriesByCategoryId(category.id);
        subCategories = subCategories.map(function(subCategory) {
          return setShortcutsForCategory(subCategory);
        });

        return {
          id: category.id,
          name: category.name,
          moduleDetector: category.moduleDetector,
          parentId: category.parentId,
          shortcuts: getShortcutsByCategoryId(category.id),
          subCategories: subCategories
        };
      });

      self.filteredCategories = allCategories.filter(isModuleOrGlobalCategory);
    }

    function showAll() {
      self.isFiltered = false;
      self.filteredCategories = allCategories;
    }

    function isModuleOrGlobalCategory(category) {
      var detector = category.moduleDetector;

      return (_.isBoolean(detector) && detector) ||
             (_.isRegExp(detector) && detector.test($state.current.name)) ||
             (_.isFunction(detector) && detector(category, $state.current.name));
    }

    function setShortcutsForCategory(category) {
      return {
        id: category.id,
        name: category.name,
        parentId: category.parentId,
        shortcuts: getShortcutsByCategoryId(category.id)
      };
    }

    function getShortcutsByCategoryId(id) {
      return esnShortcutsRegistry
        .getShortcutsByCategoryId(id)
        .map(function(shortcut) {
          var hotkey = hotkeys.get(shortcut.combo);

          return {
            id: shortcut.id,
            combo: shortcut.combo,
            comboAsText: hotkey && hotkey.format ? hotkey.format()[0] : shortcut.combo,
            description: shortcut.description
          };
        });
    }
  }
})(angular);
