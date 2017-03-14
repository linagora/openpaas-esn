(function() {
  'use strict';

  angular.module('esn.calendar')
         .factory('CalendarCollectionShell', CalendarCollectionShellFactory);

  function CalendarCollectionShellFactory(calPathBuilder, CalendarRightShell, session, CALENDAR_DEDAULT_EVENT_COLOR, DEFAULT_CALENDAR_ID, CALENDAR_RIGHT) {
    /**
     * A shell that wraps an caldav calendar component.
     * Note that href is the unique identifier and id is the calendarId inside the calendarHomeId
     * @param {Object} calendar            The caldav calendar component.
     * @param {Object} extendedProperties  Object of additional properties like:
     */
    function CalendarCollectionShell(calendar) {
      this.name = calendar['dav:name'] || 'Events';
      this.color = calendar['apple:color'] || CALENDAR_DEDAULT_EVENT_COLOR;
      this.description = calendar['caldav:description'] || '';
      this.href = calendar._links.self.href;
      this.id = this.href.split('/').pop().split('.').shift();
      this.selected = this.id === DEFAULT_CALENDAR_ID;

      this.acl = calendar.acl;
      this.invite = calendar.invite;
      this.rights = addRightsForSharedCalendar(calendar);
      this.readOnly = checkReadOnly(this.rights, session.user._id);
    }

    CalendarCollectionShell.toDavCalendar = toDavCalendar;
    CalendarCollectionShell.from = from;
    CalendarCollectionShell.buildHref = buildHref;

    return CalendarCollectionShell;

    ////////////

    /**
     * Return a dav:calendar used in body of request about calendars
     * Note that it's only used when creating a calendar for now.
     * @param  {Object} shell  a CalendarCollectionShell or an object like {href: '', name: '', color: '', description: ''}
     * @return {Object}        {'dav:name': '', 'apple:color': '', 'caldav:description': ''}
     */
    function toDavCalendar(shell) {
      if (!(shell instanceof CalendarCollectionShell)) {
        shell = CalendarCollectionShell.from(shell);
      }

      return {
        id: shell.id,
        'dav:name': shell.name,
        'apple:color': shell.color,
        'caldav:description': shell.description,
        acl: shell.acl,
        invite: shell.invite
      };
    }

    /**
     * Take an object and return a CalendarCollectionShell
     * @param  {Object} object like {href: '', name: '', color: '', description: ''}
     * @return {CalendarCollectionShell}        the new CalendarCollectionShell
     */
    function from(object) {
      return new CalendarCollectionShell({
        _links: {self: {href: object.href}},
        'dav:name': object.name,
        'apple:color': object.color,
        'caldav:description': object.description,
        acl: object.acl,
        invite: object.invite
      });
    }

    function buildHref(calendarHomeId, calendarId) {
      return calPathBuilder.forCalendarId(calendarHomeId, calendarId);
    }

    function addRightsForSharedCalendar(calendar) {
      if (calendar.invite && calendar.acl) {
       return new CalendarRightShell(calendar.acl, calendar.invite);
      }
    }

    function checkReadOnly(rights, userId) {
      if (rights) {
        return rights.getUserRight(userId) === CALENDAR_RIGHT.SHAREE_READ;
      }

      return false;
    }
  }
})();
