(function() {
  'use strict';

  angular.module('esn.calendar')
         .service('calendarService', calendarService);

  function calendarService(
    $q,
    $rootScope,
    _,
    calendarAPI,
    calCalendarSubscriptionApiService,
    CalendarCollectionShell,
    CAL_EVENTS,
    CalendarRightShell
  ) {
    var calendarsCache = {};
    var defaultCalendarApiOptions = { withRights: true };

    this.addAndEmit = addAndEmit;
    this.removeAndEmit = removeAndEmit;
    this.updateAndEmit = updateAndEmit;
    this.createCalendar = createCalendar;
    this.removeCalendar = removeCalendar;
    this.getCalendar = getCalendar;
    this.listCalendars = listCalendars;
    this.listPublicCalendars = listPublicCalendars;
    this.modifyCalendar = modifyCalendar;
    this.getRight = getRight;
    this.modifyRights = modifyRights;
    this.subscribe = subscribe;
    this.unsubscribe = unsubscribe;
    this.updateSubscription = updateSubscription;

    ////////////

    /**
     * List all calendars in the calendar home.
     * @param  {String} calendarHomeId      The calendar home id we fetch the calendars in
     * @param  {Object} options             Specific options that override default options
     * @return {[CalendarCollectionShell]}  an array of CalendarCollectionShell
     */
    function listCalendars(calendarHomeId, options) {

      function createCalendarsShell(calendars) {
        var vcalendars = [];

        calendars.forEach(function(calendar) {
          var vcal = new CalendarCollectionShell(calendar);

          vcalendars.push(vcal);
        });

        calendarsCache[calendarHomeId] = vcalendars;

        return calendarsCache[calendarHomeId];
      }

      calendarsCache[calendarHomeId] = calendarsCache[calendarHomeId] || calendarAPI.listCalendars(calendarHomeId, options || defaultCalendarApiOptions).then(createCalendarsShell);

      return $q.when(calendarsCache[calendarHomeId]);
    }

    /**
     * List all public calendars for the requested calendar home (user).
     * @param  {String}     calendarHomeId  The calendar home id of the user
     * @return {[CalendarCollectionShell]}  an array of CalendarCollectionShell
     */
    function listPublicCalendars(calendarHomeId) {
      return listCalendars(calendarHomeId, { withRights: true, public: true });
    }

    /**
     * Get a calendar
     * @param  {String}     calendarHomeId  The calendar home id
     * @param  {String}     calendarId      The calendar id
     * @return {CalendarCollectionShell}  an array of CalendarCollectionShell
     */
    function getCalendar(calendarHomeId, calendarId) {
      return calendarAPI.getCalendar(calendarHomeId, calendarId, defaultCalendarApiOptions)
        .then(function(calendar) {
          return new CalendarCollectionShell(calendar);
        });
    }

    /**
     * Delete a calendar
     * @param  {String}     calendarHomeId  The calendar home id
     * @param  {String}     calendarId      The calendar id
     */
    function removeCalendar(calendarHomeId, calendar) {
      return calendarAPI.removeCalendar(calendarHomeId, calendar.id)
        .then(function(response) {
          removeAndEmit(calendarHomeId, calendar);

          return response;
        });
    }

    function removeAndEmit(calendarHomeId, calendar) {
      var uniqueId = CalendarCollectionShell.buildUniqueId(calendarHomeId, calendar.id);

      _.remove(calendarsCache[calendarHomeId], { id: calendar.id });
      $rootScope.$broadcast(CAL_EVENTS.CALENDARS.REMOVE, { uniqueId: uniqueId });
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
          addAndEmit(calendarHomeId, calendar);

          return calendar;
        });
    }

    function addAndEmit(calendarHomeId, calendar) {
      (calendarsCache[calendarHomeId] || []).push(calendar);
      $rootScope.$broadcast(CAL_EVENTS.CALENDARS.ADD, calendar);
    }

    function updateCache(calendarHomeId, calendar) {
      (calendarsCache[calendarHomeId] || []).forEach(function(cal, index) {
        if (calendar.id === cal.id) {
          calendar.selected = calendarsCache[calendarHomeId][index].selected;
          calendarsCache[calendarHomeId][index] = calendar;
        }
      });
    }

    /**
     * Modify a calendar in the calendar home defined by its id.
     * @param  {String}                   calendarHomeId the id of the calendar in which is the calendar we want to modify
     * @param  {CalendarCollectionShell}  calendar       the calendar to modify
     * @return {Object}                                  the http response
     */
    function modifyCalendar(calendarHomeId, calendar) {
      return calendarAPI.modifyCalendar(calendarHomeId, CalendarCollectionShell.toDavCalendar(calendar))
        .then(function() {
          updateAndEmit(calendarHomeId, calendar);

          return calendar;
        });
    }

    function updateAndEmit(calendarHomeId, calendar) {
      updateCache(calendarHomeId, calendar);
      $rootScope.$broadcast(CAL_EVENTS.CALENDARS.UPDATE, calendar);
    }

    /**
     * Fetch the right on the server
     * @param  {String}                   calendarHomeId the id of the calendar in which is the calendar we want to fetch the right
     * @param  {CalendarCollectionShell}  calendar       the calendar for which we want the right
     * @return {Object}                                  the http response
     */
    function getRight(calendarHomeId, calendar) {
      return calendarAPI.getRight(calendarHomeId, calendar).then(function(data) {
        return new CalendarRightShell(data.acl, data.invite);
      });
    }

    /**
     * Modify the rights for a calendar in the specified calendar home.
     * @param {String}                  calendarHomeId  the id of the calendar home in which we will create a new calendar
     * @param {CalendarCollectionShell} calendar        the calendar to modify
     */
    function modifyRights(calendarHomeId, calendar, rightShell, oldRightShell) {
      return calendarAPI.modifyShares(calendarHomeId, calendar.id, rightShell.toDAVShareRightsUpdate(oldRightShell)).then(function() {
        $rootScope.$broadcast(CAL_EVENTS.CALENDARS.RIGHTS_UPDATE, {
          calendar: calendar,
          rights: rightShell
        });
        return calendar;
      });
    }

    function subscribe(calendarHomeId, subscription) {
      return calCalendarSubscriptionApiService.subscribe(calendarHomeId, CalendarCollectionShell.toDavCalendar(subscription))
        .then(function() {
          addAndEmit(calendarHomeId, subscription);

          return subscription;
        });
    }

    function unsubscribe(calendarHomeId, subscription) {
       return calCalendarSubscriptionApiService.unsubscribe(calendarHomeId, subscription.id)
        .then(function(response) {
          removeAndEmit(calendarHomeId, subscription);

          return response;
        });
    }

    function updateSubscription(calendarHomeId, subscription) {
      return calCalendarSubscriptionApiService.update(calendarHomeId, CalendarCollectionShell.toDavCalendar(subscription))
        .then(function() {
          updateAndEmit(calendarHomeId, subscription);

          return subscription;
        });
    }
  }
})();
