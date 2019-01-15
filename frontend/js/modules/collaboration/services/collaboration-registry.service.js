(function() {
  'use strict';

  angular.module('esn.collaboration')
    .factory('esnCollaborationRegistry', esnCollaborationRegistry);

  function esnCollaborationRegistry(esnRegistry) {
    var name = 'esnCollaborationRegistry';
    var options = {
      primaryKey: 'objectType'
    };
    var registry = esnRegistry(name, options);

    return registry;
  }
})();
