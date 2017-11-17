'use strict';

angular.module('esn.email-addresses-wrapper', [])

  .factory('emailAddresses', function($window) {
    return $window.emailAddresses;
  });
