'use strict';

angular.module('esn.attendee', [])
  .factory('attendeeService', function($q) {
    var providers = [];

    function addProvider(provider) {
      if (provider && provider.searchAttendee) {
        providers.push(provider);
      }
    }

    function getAttendeeCandidates(query, limit) {
      return $q.all(providers.map(function(provider) {
        return provider.searchAttendee(query, limit);
      })).then(function(arrays) {
        return arrays.reduce(function(resultArray, currentArray) {
          return resultArray.concat(currentArray);
        }, []);
      });
    }

    return {
      addProvider: addProvider,
      getAttendeeCandidates: getAttendeeCandidates
    };
  });
