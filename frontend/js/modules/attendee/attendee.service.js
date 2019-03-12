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

    /**
     * Search for attendees
     *
     * @param {String} query - The term to seach in attendees
     * @param {Number} limit - The number of attendees per objectType
     * @param {Array} objectTypes - Array of objectType as String
     * @param {Array} excludes - Array of tuple objects to be excluded from search
     * @param {Function} attendeesFilter - Optional function which takes the array of attendees candidates and must return another array of attendees, potentially filtered based on consumer rules
     */
    function getAttendeeCandidates(query, limit, objectTypes, excludes, attendeesFilter) {
      objectTypes = objectTypes || [ESN_ATTENDEE_DEFAULT_OBJECT_TYPE];

      return esnPeopleAPI.search(query, objectTypes, limit, excludes)
        .then(function(people) {
          return people.map(function(person) {
            var provider = _.find(providers, { objectType: person.objectType });

            person.templateUrl = provider ? provider.templateUrl : ESN_ATTENDEE_DEFAULT_TEMPLATE_URL;

            if (person.emailAddresses && person.emailAddresses[0]) {
              person.email = person.emailAddresses[0].value;
              person.preferredEmail = person.email;
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
        .then(function(attendees) {
          return attendeesFilter ? attendeesFilter(attendees) : defaultAttendeesFilter(attendees);
        });
    }

    function defaultAttendeesFilter(attendees) {
      return _.uniq(attendees, false, function(attendee) {
        return attendee.email || attendee.displayName;
      });
    }

    function getProviders() {
      return providers;
    }
  }
})(angular);
