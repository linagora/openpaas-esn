'use strict';

angular.module('linagora.esn.contact.google')
  .directive('showGoogleAccount', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/contact.google/views/show-google-account.html'
    };
  });
