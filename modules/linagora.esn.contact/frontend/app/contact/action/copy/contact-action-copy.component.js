(function(angular) {
  angular.module('linagora.esn.contact')

    .component('contactActionCopy', {
      templateUrl: '/contact/app/contact/action/copy/contact-action-copy.html',
      bindings: {
        contact: '<'
      },
      controller: 'contactActionCopyController'
    });
})(angular);
