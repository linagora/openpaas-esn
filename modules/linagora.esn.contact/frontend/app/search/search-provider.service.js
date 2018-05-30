(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact').factory('contactSearchProviderService', contactSearchProviderService);

  function contactSearchProviderService(
    $q,
    esnSearchProvider,
    session,
    ContactAPIClient,
    CONTACT_GLOBAL_SEARCH
  ) {
    return new esnSearchProvider({
      name: CONTACT_GLOBAL_SEARCH.NAME,
      fetch: function(query) {
        var searchOptions = {
          data: query,
          userId: session.user._id
        };

        return function() {
          return ContactAPIClient
            .addressbookHome(session.user._id)
            .search(searchOptions)
            .then(function(response) {
              return response.data.map(function(contact) {
                contact.type = CONTACT_GLOBAL_SEARCH.TYPE;
                contact.date = new Date();

                return contact;
              });
            });
        };
      },
      buildFetchContext: function(options) {
        return $q.when(options.query);
      },
      templateUrl: '/contact/app/search/contact-search.html',
      activeOn: ['contact']
    });
  }
})(angular);
