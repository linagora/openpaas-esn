(function(angular) {
  'use strict';

  angular.module('esn.shortcuts')
    .factory('esnShortcuts', esnShortcuts);

  function esnShortcuts(hotkeys, _, esnShortcutsRegistry) {
    return {
      use: use,
      unuse: unuse,
      register: register,
      addCategory: addCategory
    };

    function use(shortcutId, action) {
      var shortcut = esnShortcutsRegistry.getById(shortcutId);

      if (!shortcut) {
        throw new Error('no such shortcut: ' + shortcutId);
      }

      var shortcutAction = action || shortcut.action;

      if (!shortcutAction) {
        throw new Error('this shortcut is registered without action, you must provie action to use it: ' + shortcutId);
      }

      hotkeys.add({
        combo: shortcut.combo,
        description: shortcut.description,
        callback: function(event, key) {
          event.preventDefault();
          shortcutAction(event, key);
        },
        allowIn: shortcut.allowIn,
        category: shortcut.category
      });
    }

    function unuse(shortcutId) {
      var shortcut = esnShortcutsRegistry.getById(shortcutId);

      if (!shortcut) {
        throw new Error('no such shortcut: ' + shortcutId);
      }

      hotkeys.del(shortcut.combo);
    }

    function register(shortcut) {
      return esnShortcutsRegistry.register(shortcut);
    }

    function addCategory(category) {
      return esnShortcutsRegistry.addCategory(category);
    }
  }
})(angular);
