(function(angular) {
  'use strict';

  angular.module('esn.shortcuts')
    .factory('esnShortcutsGlobal', esnShortcutsGlobal);

  function esnShortcutsGlobal(
    esnShortcuts,
    esnShortcutsSheet,
    esnShortcutsAction,
    ESN_SHORTCUTS_DEFAULT_CATEGORY
  ) {
    var shortcuts = {
      OPEN_SHEET: {
        combo: '?',
        description: 'Show / hide this help page',
        action: toggleSheet
      },
      FOCUS_SEARCH_FORM: {
        combo: '/',
        description: 'Focus on the search form',
        action: esnShortcutsAction.focusOn('.search-header .search-input')
      },
      TOGGLE_APPLICATION_MENU: {
        combo: 'p',
        description: 'Show / hide the application menu',
        action: esnShortcutsAction.clickOn('.application-menu-toggler')
      }
    };

    return {
      load: load
    };

    function load() {
      esnShortcuts.register(ESN_SHORTCUTS_DEFAULT_CATEGORY, shortcuts);
    }

    function toggleSheet() {
      esnShortcutsSheet.toggle();
    }
  }
})(angular);
