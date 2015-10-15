'use strict';

angular.module('esn.calendar')

  .constant('ACCEPT_CALENDAR_HEADER', 'application/calendar+json')
  .constant('CONTENT_TYPE_CALENDAR_HEADER', 'application/calendar+json')

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

  .factory('eventAPI', function(request, ACCEPT_CALENDAR_HEADER, CONTENT_TYPE_CALENDAR_HEADER, CALENDAR_GRACE_DELAY) {

    /**
     * GET request used to get details of an event of path eventPath.
     * @param  {String} eventPath path of the event. The form is /<calendar_path>/<uuid>.ics
     * @return {Object} the http response.
     */
    function get(eventPath) {
       return request('get', eventPath, {Accept: ACCEPT_CALENDAR_HEADER})
        .then(function(response) {
          if (response.status !== 200) {
            return $q.reject(response);
          }
          return response;
        });
    }

    /**
     * PUT request used to create a new event in a specific calendar.
     * @param  {String} eventPath path of the event. The form is /<calendar_path>/<uuid>.ics
     * @param  {ICAL.Component} vcalendar a vcalendar object including the vevent to create.
     * @param  {Object} options {graceperiod: true||false} specify if we want to use the graceperiod or not.
     * @return {String||Object} a taskId if with use the graceperiod, the http response otherwise.
     */
    function create(eventPath, vcalendar, options) {
      var headers = {'Content-Type': CONTENT_TYPE_CALENDAR_HEADER};
      var body = vcalendar.toJSON();
      if (options.graceperiod) {
        return request('put', eventPath, headers, body, {graceperiod: CALENDAR_GRACE_DELAY})
          .then(function(response) {
            if (response.status !== 202) {
              return $q.reject(response);
            }
            return response.data.id;
          });
      }
      return request('put', eventPath, headers, body)
        .then(function(response) {
          if (response.status !== 201) {
            return $q.reject(response);
          }
          return response;
        });
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
