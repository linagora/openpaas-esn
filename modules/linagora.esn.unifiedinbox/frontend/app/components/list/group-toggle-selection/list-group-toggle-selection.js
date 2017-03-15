(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .component('inboxListGroupToggleSelection', {
      templateUrl: '/unifiedinbox/app/components/list/group-toggle-selection/list-group-toggle-selection.html',
      bindings: {
        group: '<',
        elements: '<'
      },
      controller: 'inboxListGroupToggleSelectionController'
    });

})();
