(function(angular) {
  'use strict';

  angular.module('esn.attendee')
    .factory('attendeeService', attendeeService);

  function attendeeService(_, esnPeopleAPI, ESN_ATTENDEE_DEFAULT_TEMPLATE_URL, ESN_ATTENDEE_DEFAULT_OBJECT_TYPE) {
    var providers = [];

    return {
      addProvider: addProvider,
      getAttendeeCandidates: getAttendeeCandidates,
      getProviders: getProviders
    };

    function addProvider(provider) {
      if (!provider) {
        return;
      }

      provider.templateUrl = provider.templateUrl || ESN_ATTENDEE_DEFAULT_TEMPLATE_URL;
      provider.objectType = provider.objectType || ESN_ATTENDEE_DEFAULT_OBJECT_TYPE;

      return providers.push(provider);
    }

    function getAttendeeCandidates(query, limit, objectTypes) {
      objectTypes = objectTypes || [ESN_ATTENDEE_DEFAULT_OBJECT_TYPE];

      return esnPeopleAPI.search(query, objectTypes, limit)
        .then(function(people) {
          return people.map(function(person) {
            var provider = _.find(providers, { objectType: person.objectType });

            person.templateUrl = provider ? provider.templateUrl : ESN_ATTENDEE_DEFAULT_TEMPLATE_URL;

            if (person.emailAddresses && person.emailAddresses[0]) {
              person.email = person.emailAddresses[0].value;
            }

            if (person.names && person.names[0]) {
              person.displayName = person.names[0].displayName;
            }

            if (person.photos && person.photos[0]) {
              person.avatarUrl = person.photos[0].url;
            }

            return person;
          });
        })
        .then(function(people) {
          return _.uniq(people, false, function(person) {
            return person.email || person.displayName;
          });
        });
    }

    function getProviders() {
      return providers;
    }
  }
})(angular);
