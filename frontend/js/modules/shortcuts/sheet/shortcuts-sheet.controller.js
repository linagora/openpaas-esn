(function(angular) {
  'use strict';

  angular.module('esn.shortcuts')
    .controller('EsnShortcutsSheetController', EsnShortcutsSheetController);

  function EsnShortcutsSheetController(esnShortcutsRegistry) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      var categories = esnShortcutsRegistry.getTopCategories();
      var subCategories = [];

      self.categories = categories.map(function(category) {
        subCategories = esnShortcutsRegistry.getSubCategoriesByCategoryId(category.id);
        subCategories = subCategories.map(function(subCategory) {
          return setShortcutsForCategory(subCategory);
        });

        return {
          id: category.id,
          name: category.name,
          parentId: category.parentId,
          shortcuts: getShortcutsByCategoryId(category.id),
          subCategories: subCategories
        };
      });
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
          return {
            id: shortcut.id,
            combo: shortcut.combo,
            description: shortcut.description
          };
        });
    }
  }
})(angular);
