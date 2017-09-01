(function(angular) {
  'use strict';

  angular.module('esn.shortcuts')
    .controller('EsnShortcutsSheetController', EsnShortcutsSheetController);

  function EsnShortcutsSheetController(esnShortcutsRegistry) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      var categories = esnShortcutsRegistry.getAllCategories();

      self.categories = categories.map(function(category) {
        return {
          id: category.id,
          name: category.name,
          shortcuts: getShortcutsByCategoryId(category.id)
        };
      });
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
