(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .directive('contactSearchForm', contactSearchForm);

  function contactSearchForm(SEARCH_INPUT_LIMIT) {
    return {
      restrict: 'E',
      templateUrl: '/contact/app/contact/form/contact-search-form.html',
      link: function(scope) {
        scope.SEARCH_INPUT_LIMIT = SEARCH_INPUT_LIMIT;
      }
    };
  }
})(angular);
