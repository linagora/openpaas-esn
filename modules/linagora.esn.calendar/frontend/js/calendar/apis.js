'use strict';

angular.module('esn.calendar')

  .constant('ACCEPT_CALENDAR_HEADER', 'application/calendar+json')
  .constant('CONTENT_TYPE_CALENDAR_HEADER', 'application/calendar+json')
  .constant('PREFER_CALENDAR_HEADER', 'return=representation')

  .factory('pathBuilder', function() {
    function forCalendarHomeId(calendarId) {
      return '/calendars/' + calendarId;
    }

    function forCalendarId(calendarHomeId, calendarId) {
      return forCalendarHomeId(calendarHomeId) + '/' + calendarId;
    }

    function forEvents(calendarId) {
      return forCalendarHomeId(calendarId) + '/events';
    }

    function forEventId(calendarId, eventId) {
      return forEvents(calendarId).replace(/\/$/, '') + '/' + eventId + '.ics';
    }

    return {
      forCalendarHomeId: forCalendarHomeId,
      forCalendarId: forCalendarId,
      forEvents: forEvents,
      forEventId: forEventId
    };
  })

  .factory('calendarAPI', function(request, FCMoment, pathBuilder, ACCEPT_CALENDAR_HEADER) {

    /**
     * Queries one or more calendars for events in a specific range. The dav:calendar resources will include their items.
     * @param  {String}   calendarId The calendarId.
     * @param  {FCMoment} start      FCMoment type of Date, specifying the start of the range.
     * @param  {FCMoment} end        FCMoment type of Date, specifying the end of the range.
     * @return {Object}              An array of vcalendar items.
     */
    function listEvents(calendarId, start, end) {
      var body = {
        match: {
          start: start.format('YYYYMMDD[T]HHmmss'),
          end: end.format('YYYYMMDD[T]HHmmss')
        }
      };
      var path = pathBuilder.forEvents(calendarId);
      return request('post', path + '.json', null, body)
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

    /**
     * Queries one or more calendars for events. The dav:calendar resources will include their items.
     * @param  {String}   calendarHomeId The calendarHomeId.
     * @param  {String}   calendarId     The calendarId.
     * @param  {FCMoment} start          FCMoment type of Date, specifying the start of the range.
     * @param  {FCMoment} end            FCMoment type of Date, specifying the end of the range.
     * @return {Object}                  An array of vcalendar items.
     */
    function listEventsForCalendar(calendarHomeId, calendarId, start, end) {
      var body = {
        match: {
          start: start.format('YYYYMMDD[T]HHmmss'),
          end: end.format('YYYYMMDD[T]HHmmss')
        }
      };
      var path = pathBuilder.forCalendarId(calendarHomeId, calendarId);
      return request('post', path + '.json', null, body)
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

    /**
     * List all calendar homes and calendars in the calendar root.
     * @param  {String} calendarId The calendarId.
     * @return {Object}            The http response, A dav:root resource, expanded down to all dav:calendar resouces.
     */
    function listCalendars(calendarId) {
      var path = pathBuilder.forCalendarHomeId(calendarId);
      return request('get', path, {Accept: ACCEPT_CALENDAR_HEADER})
        .then(function(response) {
          if (response.status !== 200) {
            return $q.reject(response);
          }
          return response;
        });
    }

    return {
      listEvents: listEvents,
      listCalendars: listCalendars,
      listEventsForCalendar: listEventsForCalendar
    };
  })

  .factory('eventAPI', function($q, request, ACCEPT_CALENDAR_HEADER, CONTENT_TYPE_CALENDAR_HEADER, CALENDAR_GRACE_DELAY, PREFER_CALENDAR_HEADER) {

    /**
     * GET request used to get details of an event of path eventPath.
     * @param  {String} eventPath path of the event. The form is /<calendar_path>/<uuid>.ics
     * @return {Object}           the http response.
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
     * @param  {String}         eventPath path of the event. The form is /<calendar_path>/<uuid>.ics
     * @param  {ICAL.Component} vcalendar a vcalendar object including the vevent to create.
     * @param  {Object}         options   {graceperiod: true||false} specify if we want to use the graceperiod or not.
     * @return {String||Object}           a taskId if with use the graceperiod, the http response otherwise.
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

    /**
     * PUT request used to modify an event in a specific calendar.
     * @param  {String}         eventPath path of the event. The form is /<calendar_path>/<uuid>.ics
     * @param  {ICAL.Component} vcalendar a vcalendar object including the vevent to create.
     * @param  {String}         etag      set the If-Match header to this etag before sending the request
     * @return {String}                   the taskId which will be used to create the grace period.
     */
    function modify(eventPath, vcalendar, etag) {
      var headers = {
        'If-Match': etag,
        'Content-Type': CONTENT_TYPE_CALENDAR_HEADER,
        'Prefer': PREFER_CALENDAR_HEADER
      };
      var body = vcalendar.toJSON();
      return request('put', eventPath, headers, body, { graceperiod: CALENDAR_GRACE_DELAY })
        .then(function(response) {
          if (response.status !== 202) {
            return $q.reject(response);
          }
          return response.data.id;
        });
    }

    /**
     * DELETE request used to remove an event in a specific calendar.
     * @param  {String} eventPath path of the event. The form is /<calendar_path>/<uuid>.ics
     * @param  {String} etag      set the If-Match header to this etag before sending the request
     * @return {String}           the taskId which will be used to create the grace period.
     */
    function remove(eventPath, etag) {
      var headers = {'If-Match': etag};
      return request('delete', eventPath, headers, null, { graceperiod: CALENDAR_GRACE_DELAY })
        .then(function(response) {
          if (response.status !== 202) {
            return $q.reject(response);
          }
          return response.data.id;
        });
    }

    /**
     * PUT request used to change the participation status of an event
     * @param  {String}         eventPath path of the event. The form is /<calendar_path>/<uuid>.ics
     * @param  {ICAL.Component} vcalendar a vcalendar object including the vevent to create.
     * @param  {String}         etag      set the If-Match header to this etag before sending the request
     * @return {Object}                   the http response.
     */
    function changeParticipation(eventPath, vcalendar, etag) {
      var headers = {
        'Content-Type': CONTENT_TYPE_CALENDAR_HEADER,
        'Prefer': PREFER_CALENDAR_HEADER
      };
      if (etag) {
        headers['If-Match'] = etag;
      }
      var body = vcalendar.toJSON();
      return request('put', eventPath, headers, body)
        .then(function(response) {
          if (response.status !== 200 && response.status !== 204) {
            return $q.reject(response);
          }
          return response;
        });
    }

    return {
      get: get,
      create: create,
      modify: modify,
      remove: remove,
      changeParticipation: changeParticipation
    };
  });
