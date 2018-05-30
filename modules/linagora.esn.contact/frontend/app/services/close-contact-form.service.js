(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('closeContactForm', closeContactForm);

  function closeContactForm($state) {
    return function() {
      $state.go('contact');
    };
  }
})(angular);
