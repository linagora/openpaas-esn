(function(angular) {
    'use strict';

    angular.module('linagora.esn.contact')
      .component('contactConfigForm', {
        templateUrl: '/contact/app/config/contact-config-form.html',
        bindings: {
          configurations: '='
        }
      });

})(angular);
