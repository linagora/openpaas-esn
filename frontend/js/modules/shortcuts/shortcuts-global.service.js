(function(angular) {
  'use strict';

  angular.module('esn.shortcuts')
    .factory('esnShortcutsGlobal', esnShortcutsGlobal);

  function esnShortcutsGlobal(esnShortcuts, esnShortcutsSheet, esnShortcutsAction) {
    var shortcuts = [{
      id: 'core.open_sheet',
      combo: '?',
      description: 'Show / hide this help page',
      action: toggleSheet
    }, {
      id: 'core.focus_search_form',
      combo: '/',
      description: 'Focus on the search form',
      action: esnShortcutsAction.focusOn('.search-header .search-input')
    }, {
      id: 'core.toggle_application_menu',
      combo: 'p',
      description: 'Show / hide the application menu',
      action: esnShortcutsAction.clickOn('.application-menu-toggler')
    }];

    return {
      load: load
    };

    function load() {
      shortcuts.forEach(function(shortcut) {
        esnShortcuts.register(shortcut);
        esnShortcuts.use(shortcut.id);
      });
    }

    function toggleSheet() {
      esnShortcutsSheet.toggle();
    }
  }
})(angular);
