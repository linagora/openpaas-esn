(function(angular) {
  'use strict';

  angular.module('esn.attendee')
    .factory('attendeeService', attendeeService);

  function attendeeService($q, _, ESN_ATTENDEE_DEFAULT_TEMPLATE_URL, ESN_ATTENDEE_DEFAULT_OBJECT_TYPE) {
    var providers = [];

    return {
      addProvider: addProvider,
      getAttendeeCandidates: getAttendeeCandidates,
      getProviders: getProviders
    };

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

        providers.push(provider);
      }
    }

    function getAttendeeCandidates(query, limit, objectTypes) {
      objectTypes = objectTypes || [ESN_ATTENDEE_DEFAULT_OBJECT_TYPE];

      var matchingProviders = _.filter(providers, function(provider) {
        return _.contains(objectTypes, provider.objectType);
      });

      return $q.all(matchingProviders.map(function(provider) {
        return provider.search(query, limit);
      }))
      .then(function(arrays) {
        return arrays.reduce(function(resultArray, currentArray) {
          return resultArray.concat(currentArray);
        }, []);
      })
      .then(function(attendees) {
        return _.uniq(attendees, false, function(attendee) {
          return attendee.email || attendee.displayName;
        });
      });
    }

    function getProviders() {
      return providers;
    }
  }
})(angular);
