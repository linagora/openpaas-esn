(function() {
  'use strict';

  angular.module('esn.calendar')
         .constant('CALENDAR_ACCEPT_HEADER', 'application/calendar+json')
         .constant('CALENDAR_DAV_DATE_FORMAT', 'YYYYMMDD[T]HHmmss')
         .factory('calendarAPI', calendarAPI);

  calendarAPI.$inject = [
    'calendarRestangular',
    'pathBuilder',
    'request',
    'CALENDAR_ACCEPT_HEADER',
    'CALENDAR_DAV_DATE_FORMAT'
  ];

  function calendarAPI(calendarRestangular, pathBuilder, request, CALENDAR_ACCEPT_HEADER, CALENDAR_DAV_DATE_FORMAT) {
    var service = {
      listEvents: listEvents,
      searchEvents: searchEvents,
      listCalendars: listCalendars,
      getCalendar: getCalendar,
      listEventsForCalendar: listEventsForCalendar,
      listAllCalendars: listAllCalendars,
      createCalendar: createCalendar,
      modifyCalendar: modifyCalendar
    };

    return service;

    ////////////

    /**
     * Query one or more calendars for events in a specific range. The dav:calendar resources will include their dav:item resources.
     * @param  {String}   calendarHref The href of the calendar.
     * @param  {fcMoment} start        fcMoment type of Date, specifying the start of the range.
     * @param  {fcMoment} end          fcMoment type of Date, specifying the end of the range.
     * @return {Object}                An array of dav:items items.
     */
    function listEvents(calendarHref, start, end) {
      var body = {
        match: {
          start: start.format(CALENDAR_DAV_DATE_FORMAT),
          end: end.format(CALENDAR_DAV_DATE_FORMAT)
        }
      };

      return request('post', calendarHref, null, body)
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
     * Query a calendar, searching for indexed events depending on the query. The dav:calendar resources will include their dav:item resources.
     * @method searchEvents
     * @param  {[type]} calendarId     The calendar id.
     * @param  {[type]} options        The query parameters {query: '', limit: 20, offset: 0}
     * @return {Object}                An array of dav:item items.
     */
    function searchEvents(calendarId, options) {
      return calendarRestangular.one(calendarId).one('events.json').get({query: options.query, limit: options.limit, offset: options.offset, sortKey: options.sortKey, sortOrder: options.sortOrder})
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
     * Query one or more calendars for events. The dav:calendar resources will include their dav:item resources.
     * @param  {String}   calendarHomeId The calendarHomeId.
     * @param  {String}   calendarId     The calendarId.
     * @param  {fcMoment} start          fcMoment type of Date, specifying the start of the range.
     * @param  {fcMoment} end            fcMoment type of Date, specifying the end of the range.
     * @return {Object}                  An array of dav:item items.
     */
    function listEventsForCalendar(calendarHomeId, calendarId, start, end) {
      var body = {
        match: {
          start: start.format(CALENDAR_DAV_DATE_FORMAT),
          end: end.format(CALENDAR_DAV_DATE_FORMAT)
        }
      };
      var path = pathBuilder.forCalendarId(calendarHomeId, calendarId);

      return request('post', path, null, body)
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
     * List all calendar homes and calendars in the calendar root. A dav:root resource, expanded down to all dav:home resouces.
     * @param  {String} calendarId The calendarId.
     * @return {Object}            An array of dav:home items
     */
    function listAllCalendars() {
      var path = pathBuilder.rootPath();

      return request('get', path + '/.json', {Accept: CALENDAR_ACCEPT_HEADER})
        .then(function(response) {
          if (response.status !== 200) {
            return $q.reject(response);
          }
          if (!response.data || !response.data._embedded || !response.data._embedded['dav:home']) {
            return [];
          }

          return response.data._embedded['dav:home'];
        });
    }

    /**
     * List all calendars in the calendar home. A dav:home resource, containing all dav:calendar resources in it.
     * @param  {String} calendarHomeId The calendarHomeId.
     * @return {Object}                An array of dav:calendar
     */
    function listCalendars(calendarId) {
      var path = pathBuilder.forCalendarHomeId(calendarId);

      return request('get', path, {Accept: CALENDAR_ACCEPT_HEADER})
        .then(function(response) {
          if (response.status !== 200) {
            return $q.reject(response);
          }
          if (!response.data || !response.data._embedded || !response.data._embedded['dav:calendar']) {
            return [];
          }

          return response.data._embedded['dav:calendar'];
        });
    }

    /**
     * Get a calendar (dav:calendar).
     * @param  {String} calendarHomeId The calendarHomeId.
     * @param  {String} calendarId     The calendarId.
     * @return {Object} An array of dav:calendar
     */
    function getCalendar(calendarHomeId, calendarId) {
      var path = pathBuilder.forCalendarId(calendarHomeId, calendarId);

      return request('get', path, {Accept: CALENDAR_ACCEPT_HEADER})
        .then(function(response) {
          if (response.status !== 200) {
            return $q.reject(response);
          }

          return response.data;
        });
    }

    /**
     * Create a calendar in the specified calendar home.
     * @param  {String}         calendarHomeId   The calendar home id in which to create a new calendar
     * @param  {ICAL.Component} calendar      A dav:calendar object, with an additional member "id" which specifies the id to be used in the calendar url.
     * @return {Object}                        the http response.
     */
    function createCalendar(calendarHomeId, calendar) {
      var path = pathBuilder.forCalendarHomeId(calendarHomeId);

      return request('post', path, null, calendar)
        .then(function(response) {
          if (response.status !== 201) {
            return $q.reject(response);
          }

          return response;
        });
    }

    /**
     * Modify a calendar in the specified calendar home.
     * @param  {String}         calendarHomeId   The calendar home id in which to create a new calendar
     * @param  {ICAL.Component} calendar      A dav:calendar object, with an additional member "id" which specifies the id to be used in the calendar url.
     * @return {Object}                        the http response.
     */
    function modifyCalendar(calendarHomeId, calendar) {
      var path = pathBuilder.forCalendarId(calendarHomeId, calendar.id);

      return request('proppatch', path, null, calendar)
        .then(function(response) {
          if (response.status !== 204) {
            return $q.reject(response);
          }

          return response;
        });
    }
  }

})();
