(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact').factory('contactSearchResultsProviderSubmit', contactSearchResultsProviderSubmit);

  function contactSearchResultsProviderSubmit($state) {
    return function(query, stateParams, context) {
      context = context || {};
      context.reload = true;
      context.location = 'replace';

      stateParams.context = '';
      stateParams.account = '';

      $state.go('contact.search', stateParams, context);
    };
  }
})(angular);
