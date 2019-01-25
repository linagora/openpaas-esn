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

    function higherPriorityFirst(provider) {
      return -provider.priority;
    }

    function addProvider(provider) {
      if (provider && provider.searchAttendee) {
        if (!provider.templateUrl) {
          provider.templateUrl = ESN_ATTENDEE_DEFAULT_TEMPLATE_URL;
        }

        provider.objectType = provider.objectType || ESN_ATTENDEE_DEFAULT_OBJECT_TYPE;

        provider.search = function(query, limit) {
          return provider.searchAttendee(query, limit).then(function(attendees) {
            return attendees.map(function(attendee) {
              return angular.extend(attendee, { templateUrl: provider.templateUrl, objectType: provider.objectType });
            });
          });
        };

        // Before the introduction of providers priority the providers were pushed to the end of the array
        // without any particular order. To minimize the risk of regressions, the below 'if' maintains a backwards-
        // compatibility with the previous behavior.
        // If all registered providers implement a priority, this can safely be removed.
        if (!provider.priority) {
          return providers.push(provider);
        }

        providers.splice(_.sortedIndex(providers, provider, higherPriorityFirst), 0, provider);
      }
    }

    function getAttendeeCandidates(query, limit, objectTypes) {
      objectTypes = objectTypes || [ESN_ATTENDEE_DEFAULT_OBJECT_TYPE];

      return esnPeopleAPI.search(query, objectTypes, limit)
        .then(function(people) {
          return people.map(function(person) {
            // Temp hack because templateUrl is not defined on the backend side
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
