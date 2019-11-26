(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact').factory('contactSearchProviders', contactSearchProviders);

  function contactSearchProviders(
    _,
    $q,
    Providers,
    esnSearchProvider,
    contactSearchResultsProviderSubmit,
    session,
    PageAggregatorService,
    ELEMENTS_PER_REQUEST,
    CONTACT_GLOBAL_SEARCH
  ) {
    var providers = new Providers();
    var searchProvider;

    return {
      register: register,
      get: get
    };

    function register(provider) {
      providers.add(provider);
    }

    function get() {
      if (searchProvider) {
        return searchProvider;
      }
      searchProvider = new esnSearchProvider({
        uid: 'op.contacts.all',
        name: CONTACT_GLOBAL_SEARCH.NAME,
        fetch: function(query) {
          var aggregator;
          var searchOptions = {
            query: query
          };

          return function() {
            if (aggregator) {
              return load();
            }

            return buildSearchOptions(searchOptions)
              .then(function(options) { return providers.getAll(options); })
              .then(function(providers) {
                aggregator = new PageAggregatorService('searchContactsResultControllerAggregator', providers, {
                  compare: function(a, b) { return b.date - a.date; },
                  // will not work if not the same...
                  results_per_page: ELEMENTS_PER_REQUEST,
                  first_page_size: ELEMENTS_PER_REQUEST
                });

                return load();
              });

            function load() {
              return aggregator.loadNextItems().then(_.property('data'));
            }
          };
        },
        buildFetchContext: function(options) {
          return $q.when(options.query);
        },
        onSubmit: contactSearchResultsProviderSubmit,
        templateUrl: '/contact/app/search/contact-search.html',
        activeOn: ['contact'],
        placeHolder: 'Search in contacts'
      });

      return searchProvider;
    }

    function buildSearchOptions(query) {
      return providers.getAllProviderDefinitions().then(function(providers) {
        query.acceptedIds = providers.map(_.property('id'));

        return query;
      });
    }
  }

})(angular);
