(function(angular) {
  'use strict';

  angular.module('esn.subheader')
    .component('esnSubheaderSaveButton', {
      templateUrl: '/views/modules/subheader/save-button/save-button',
      controller: 'esnSubheaderSaveButtonController',
      bindings: {
        onClick: '&',
        form: '<'
      }
    });
})(angular);
