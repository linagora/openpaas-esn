(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .component('inboxListHeader', {
      templateUrl: '/unifiedinbox/app/components/list/header/list-header.html',
      bindings: {
        item: '<',
        filters: '<'
      },
      controller: 'inboxListHeaderController'
    });

})();
