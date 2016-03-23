'use strict';

angular.module('esn.calendar').factory('masterEventCache', function($timeout, MASTER_EVENT_CACHE_TTL) {
  var map = {};

  function save(shell) {
    if (!shell.isInstance()) {
      remove(shell);
      map[shell.path] = {
        shell: shell,
        deletionPromise: $timeout(function() {
          delete map[shell.path];
        }, MASTER_EVENT_CACHE_TTL)
      };
    }
  }

  function get(path) {
    return map[path] && map[path].shell;
  }

  function remove(shell) {
    map[shell.path] && $timeout.cancel(map[shell.path].deletionPromise);
    delete map[shell.path];
  }

  return {
    save: save,
    get: get,
    remove: remove
  };
});
