(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact').run(runBlock);
  function runBlock(esnSearchQueryService) {
    esnSearchQueryService.addSearchKeeper(function(toState) {
      return toState.name === 'contact.search';
    });
  }
})(angular);
