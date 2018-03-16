(function(angular) {
  angular.module('linagora.esn.contact')

    .component('contactActionMove', {
      templateUrl: '/contact/app/contact/action/move/contact-action-move.html',
      bindings: {
        contact: '<'
      },
      controller: 'contactActionMoveController'
    });
})(angular);
