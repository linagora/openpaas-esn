(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .component('inboxFilterInput', {
      templateUrl: '/unifiedinbox/app/components/filter-input/filter-input.html',
      bindings: {
        onChange: '&'
      }
    });

})();
