'use strict';

angular.module('esn.calendar')

  .constant('ACCEPT_CALENDAR_HEADER', 'application/calendar+json')

  .factory('calendarAPI', function(request, FCMoment) {
    function listEvents(calendarPath, start, end, timezone) {
      var body = {
        match: {
          start: FCMoment(start).format('YYYYMMDD[T]HHmmss'),
          end: FCMoment(end).format('YYYYMMDD[T]HHmmss')
        }
      };
      return request('post', calendarPath + '.json', null, body)
        .then(function(response) {
          if (response.status !== 200) {
            return $q.reject(response);
          }
          if (!response.data || !response.data._embedded || !response.data._embedded['dav:item']) {
            return [];
          }
          return response.data._embedded['dav:item'];
        });
    }

    return {
      listEvents: listEvents
    };
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
      create: create,
      modify: modify,
      remove: remove,
      changeParticipation: changeParticipation
    };
  });
