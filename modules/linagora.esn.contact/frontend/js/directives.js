'use strict';

angular.module('linagora.esn.contact')
  .directive('contactNavbarLink', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/contacts/views/partials/contact-navbar-link.html'
    };
  });
