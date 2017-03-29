(function() {
  'use strict';

  angular.module('linagora.esn.controlcenter')

  .component('controlcenterGeneralSubheader', {
    templateUrl: '/controlcenter/app/general/controlcenter-general-subheader',
    bindings: {
      onFormSubmit: '&',
      form: '<'
    }
  });
})();
