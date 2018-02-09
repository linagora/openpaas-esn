(function(angular) {
  'use strict';

  angular.module('esn.form.helper')
    .component('esnEmailInput', {
      templateUrl: '/views/modules/form-helper/email-input/email-input.html',
      controller: 'esnEmailInputController',
      bindings: {
        email: '=',
        domainName: '<',
        form: '<',
        availabilityChecker: '&'
      }
    });
})(angular);
