'use strict';

angular.module('esn.calendar').factory('masterEventCache', function($timeout, MASTER_EVENT_CACHE_TTL) {
  var map = {};

  function save(shell) {
    if (!shell.isInstance()) {
      map[shell.path] = shell;
      $timeout(function() {
        delete map[shell.path];
      }, MASTER_EVENT_CACHE_TTL);
    }
  }

  function get(path) {
    return map[path];
  }

  return {
    save: save,
    get: get
  };
});
