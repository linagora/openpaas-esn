(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .component('contactAddressbookSharedRightDisplay', {
      bindings: {
        public: '<'
      },
      controller: 'contactAddressbookSharedRightDisplayController',
      template: '<span>{{::$ctrl.displayRight | esnI18n}}</span>'
    });
})(angular);
