(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .factory('inboxPlugins', function(esnRegistry) {
      return esnRegistry('inboxContextHelpers', { primaryKey: 'type' });
    });

})();
