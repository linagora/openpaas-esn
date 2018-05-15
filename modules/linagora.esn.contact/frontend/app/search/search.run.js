(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact').run(runBlock);

  function runBlock(searchProviders, contactSearchProviderService) {
    searchProviders.add(contactSearchProviderService);
  }

})(angular);
