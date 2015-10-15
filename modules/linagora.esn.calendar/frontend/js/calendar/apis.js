'use strict';

angular.module('esn.calendar')

  .constant('ACCEPT_CALENDAR_HEADER', 'application/calendar+json')

  .factory('calendarAPI', function(request) {

  })

  .factory('eventAPI', function(request, ACCEPT_CALENDAR_HEADER) {

    function get(eventPath) {
       return request('get', eventPath, {Accept: ACCEPT_CALENDAR_HEADER})
        .then(function(response) {
          if (response.status !== 200) {
            return $q.reject(response);
          }
          return response;
        });
    }

    function create() {

    }

    function modify() {

    }

    function remove() {

    }

    function changeParticipation() {

    }

    return {
      get: get,
      list: list,
      create: create,
      modify: modify,
      remove: remove,
      changeParticipation: changeParticipation
    };
  });
