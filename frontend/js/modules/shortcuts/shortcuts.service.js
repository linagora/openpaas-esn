(function(angular) {
  'use strict';

  angular.module('esn.shortcuts')
    .factory('esnShortcuts', esnShortcuts);

  function esnShortcuts(hotkeys, _, esnShortcutsRegistry, deviceDetector) {
    return {
      use: use,
      unuse: unuse,
      register: register
    };

    function use(shortcutId, action, scope) {
      if (deviceDetector.isMobile()) { return; }

      shortcutId = (shortcutId && shortcutId.id) ? shortcutId.id : shortcutId;

      var shortcut = esnShortcutsRegistry.getById(shortcutId);

      if (!shortcut) {
        throw new Error('no such shortcut: ' + shortcutId);
      }

      var shortcutAction = action || shortcut.action || function() {};

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

      if (scope) {
        scope.$on('$destroy', function() {
          unuse(shortcutId);
        });
      }
    }

    function unuse(shortcutId) {
      if (deviceDetector.isMobile()) { return; }

      shortcutId = (shortcutId && shortcutId.id) ? shortcutId.id : shortcutId;

      var shortcut = esnShortcutsRegistry.getById(shortcutId);

      if (!shortcut) {
        throw new Error('no such shortcut: ' + shortcutId);
      }

      hotkeys.del(shortcut.combo);
    }

    function register(category, shortcuts) {
      if (deviceDetector.isMobile()) { return; }

      shortcuts = shortcuts || category.shortcuts;

      esnShortcutsRegistry.addCategory({
        id: category.id,
        name: category.name,
        moduleDetector: category.moduleDetector,
        parentId: category.parentId
      });

      angular.forEach(shortcuts, function(shortcut, key) {
        shortcut.category = category.id;
        shortcut.id = category.id + '.' + key.toLowerCase();
        esnShortcutsRegistry.register(shortcut);

        use(shortcut);
      });
    }
  }
})(angular);
