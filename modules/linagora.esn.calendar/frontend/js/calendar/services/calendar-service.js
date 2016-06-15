'use strict';

angular.module('esn.calendar')
  .service('calendarService', function($q, $rootScope, CalendarCollectionShell, calendarAPI, CALENDAR_EVENTS, CalendarRightShell) {
    var calendarsCache = {};
    var promiseCache = {};

    /**
     * List all calendars in the calendar home.
     * @param  {String}     calendarHomeId  The calendar home id
     * @return {[CalendarCollectionShell]}  an array of CalendarCollectionShell
     */
    function listCalendars(calendarHomeId) {
      promiseCache[calendarHomeId] = promiseCache[calendarHomeId] || calendarAPI.listCalendars(calendarHomeId)
        .then(function(calendars) {
          var vcalendars = [];

          calendars.forEach(function(calendar) {
            var vcal = new CalendarCollectionShell(calendar);

            vcalendars.push(vcal);
          });

          calendarsCache[calendarHomeId] = vcalendars;

          return calendarsCache[calendarHomeId];
        })
        .catch($q.reject);

      return promiseCache[calendarHomeId];
    }

    /**
     * Get a calendar
     * @param  {String}     calendarHomeId  The calendar home id
     * @param  {String}     calendarId      The calendar id
     * @return {CalendarCollectionShell}  an array of CalendarCollectionShell
     */
    function getCalendar(calendarHomeId, calendarId) {
      return calendarAPI.getCalendar(calendarHomeId, calendarId)
        .then(function(calendar) {
          return new CalendarCollectionShell(calendar);
        })
        .catch($q.reject);
    }

    /**
     * Create a new calendar in the calendar home defined by its id.
     * @param  {String}                   calendarHomeId the id of the calendar in which we will create a new calendar
     * @param  {CalendarCollectionShell}  calendar       the calendar to create
     * @return {Object}                                  the http response
     */
    function createCalendar(calendarHomeId, calendar) {
      return calendarAPI.createCalendar(calendarHomeId, CalendarCollectionShell.toDavCalendar(calendar))
        .then(function() {
          (calendarsCache[calendarHomeId] || []).push(calendar);
          $rootScope.$broadcast(CALENDAR_EVENTS.CALENDARS.ADD, calendar);

          return calendar;
        })
        .catch($q.reject);
    }

    /** * Modify a calendar in the calendar home defined by its id.
     * @param  {String}                   calendarHomeId the id of the calendar in which we will create a new calendar
     * @param  {CalendarCollectionShell}  calendar       the calendar to create
     * @return {Object}                                  the http response
     */
    function modifyCalendar(calendarHomeId, calendar) {
      return calendarAPI.modifyCalendar(calendarHomeId, CalendarCollectionShell.toDavCalendar(calendar))
        .then(function() {
          (calendarsCache[calendarHomeId] || []).forEach(function(cal, index) {
            if (calendar.id === cal.id) {
              calendar.selected = calendarsCache[calendarHomeId][index].selected;
              calendarsCache[calendarHomeId][index] = calendar;
            }
          });
          $rootScope.$broadcast(CALENDAR_EVENTS.CALENDARS.UPDATE, calendar);

          return calendar;
        })
        .catch($q.reject);
    }

    /** * Fetch the right on the server
     * @param  {String}                   calendarHomeId the id of the calendar in which is the calendar we want to fetch the right
     * @param  {CalendarCollectionShell}  calendar       the calendar for which we want the right
     * @return {Object}                                  the http response
     */
    function getRight(calendarHomeId, calendar) {
      return calendarAPI.getRight(calendarHomeId, calendar).then(function(data) {
        return new CalendarRightShell(data.acl, data.invite);
      });
    }

    this.listCalendars = listCalendars;
    this.getCalendar = getCalendar;
    this.createCalendar = createCalendar;
    this.modifyCalendar = modifyCalendar;
    this.getRight = getRight;
  });
