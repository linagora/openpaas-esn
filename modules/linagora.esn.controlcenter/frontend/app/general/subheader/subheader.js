(function() {
  'use strict';

  angular.module('linagora.esn.controlcenter')

  .component('controlcenterGeneralSubheader', {
    templateUrl: '/controlcenter/app/general/subheader/subheader',
    bindings: {
      onFormSubmit: '&',
      form: '<'
    }
  });
})();
