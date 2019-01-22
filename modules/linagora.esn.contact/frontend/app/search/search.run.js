(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact').run(runBlock);

  function runBlock(searchProviders, contactSearchProviderService, contactSearchProviders, memberSearchProvider, esnConfig) {
    esnConfig('core.membersCanBeSearched', true).then(function(membersCanBeSearched) {
      membersCanBeSearched && contactSearchProviders.register(memberSearchProvider);
    });

    contactSearchProviders.register(contactSearchProviderService);
    searchProviders.add(contactSearchProviders.get());
  }

})(angular);
