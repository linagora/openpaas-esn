(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact').factory('contactSearchProviderService', contactSearchProviderService);

  function contactSearchProviderService(
    $q,
    esnSearchProvider,
    session,
    ContactAPIClient,
    CONTACT_GLOBAL_SEARCH,
    ELEMENTS_PER_REQUEST
  ) {
    return new esnSearchProvider({
      uid: 'op.contacts',
      name: CONTACT_GLOBAL_SEARCH.NAME,
      fetch: function(query) {
        var searchOptions = {
          data: query,
          page: 1,
          limit: ELEMENTS_PER_REQUEST
        };

        return function() {
          return ContactAPIClient
            .addressbookHome(session.user._id)
            .search(searchOptions)
            .then(function(response) {
              searchOptions.page++;

              return response.data.map(function(contact) {
                contact.type = CONTACT_GLOBAL_SEARCH.TYPE;
                contact.date = new Date();

                return contact;
              });
            });
        };
      },
      buildFetchContext: function(options) {
        return $q.when(options.query && options.query.text);
      },
      templateUrl: '/contact/app/search/contact-search.html',
      activeOn: []
    });
  }
})(angular);
