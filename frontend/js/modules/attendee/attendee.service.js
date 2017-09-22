(function(angular) {
  'use strict';

  angular.module('esn.attendee')
    .factory('attendeeService', attendeeService);

  function attendeeService($q, _, DEFAULT_TEMPLATE_URL) {
    var providers = [];

    return {
      addProvider: addProvider,
      getAttendeeCandidates: getAttendeeCandidates
    };

    function addProvider(provider) {
      if (provider && provider.searchAttendee) {
        if (!provider.templateUrl) {
          provider.templateUrl = DEFAULT_TEMPLATE_URL;
        }

        provider.search = function(query, limit) {
          return provider.searchAttendee(query, limit).then(function(attendees) {
            return attendees.map(function(attendee) {
              return angular.extend(attendee, { templateUrl: provider.templateUrl });
            });
          });
        };

        providers.push(provider);
      }
    }

    function getAttendeeCandidates(query, limit) {
      return $q.all(providers.map(function(provider) {
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
  }
})(angular);
