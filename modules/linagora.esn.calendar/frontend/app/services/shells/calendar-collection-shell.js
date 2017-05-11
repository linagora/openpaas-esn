(function() {
  'use strict';

  angular.module('esn.calendar')
    .factory('CalendarCollectionShell', CalendarCollectionShellFactory);

  function CalendarCollectionShellFactory(_, calPathBuilder, calPathParser, CalendarRightShell, session, userAPI, CAL_DEFAULT_EVENT_COLOR, CAL_DEFAULT_CALENDAR_ID, CAL_CALENDAR_PUBLIC_RIGHT, CAL_CALENDAR_SHARED_RIGHT) {
    /**
     * A shell that wraps an caldav calendar component.
     * Note that href is the unique identifier and id is the calendarId inside the calendarHomeId
     * @param {Object} calendar            The caldav calendar component.
     * @param {Object} extendedProperties  Object of additional properties like:
     */
    function CalendarCollectionShell(calendar) {
      this.name = calendar['dav:name'] || 'Events';
      this.color = calendar['apple:color'] || CAL_DEFAULT_EVENT_COLOR;
      this.description = calendar['caldav:description'] || '';
      this.href = calendar._links.self.href;

      var parsedPath = calPathParser.parseCalendarPath(this.href);

      this.id = parsedPath.calendarId;
      this.calendarHomeId = parsedPath.calendarHomeId;
      this.selected = this.id === CAL_DEFAULT_CALENDAR_ID;

      this.acl = calendar.acl;
      this.invite = calendar.invite;
      this.rights = new CalendarRightShell(calendar.acl, calendar.invite);
      this.readOnly = !this.isWritable(session.user._id);
    }

    Object.defineProperty(CalendarCollectionShell.prototype, 'uniqueId', { get: function() { return this.href; } });

    CalendarCollectionShell.prototype.getOwner = getOwner;
    CalendarCollectionShell.prototype.isAdmin = isAdmin;
    CalendarCollectionShell.prototype.isOwner = isOwner;
    CalendarCollectionShell.prototype.isPublic = isPublic;
    CalendarCollectionShell.prototype.isReadable = isReadable;
    CalendarCollectionShell.prototype.isShared = isShared;
    CalendarCollectionShell.prototype.isWritable = isWritable;

    CalendarCollectionShell.toDavCalendar = toDavCalendar;
    CalendarCollectionShell.from = from;
    CalendarCollectionShell.buildHref = buildHref;
    CalendarCollectionShell.buildUniqueId = buildHref;
    CalendarCollectionShell.splitUniqueId = splitUniqueId;

    return CalendarCollectionShell;

    ////////////

    /**
     * Return a dav:calendar used in body of request about calendars
     * Note that it's only used when creating a calendar for now.
     * @param  {Object} shell  a CalendarCollectionShell or an object like {href: '', name: '', color: '', description: ''}
     * @returns {Object}        {'dav:name': '', 'apple:color': '', 'caldav:description': ''}
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
     * @returns {CalendarCollectionShell}        the new CalendarCollectionShell
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

    function splitUniqueId(uniqueId) {
      return calPathParser.parseCalendarPath(uniqueId);
    }

    /**
     * Get the owner of the calendar
     * @returns {user} return the owner of the calendar
     */
    function getOwner() {
      return userAPI.user(this.rights.getOwnerId()).then(function(response) {
        return response.data;
      });
    }

    /**
     * Check if the userId can perform admin task on this calendar
     * @param userId
     * @returns {boolean} return true if userId has admin right on this calendar
     */
    function isAdmin(userId) {
      return this.isOwner(userId) || this.rights.getShareeRight(userId) === CAL_CALENDAR_SHARED_RIGHT.SHAREE_ADMIN;
    }

    /**
     * Check if the user is the owner of the calendar
     * @returns {boolean} return true if the user is the owner of the calendar
     */
    function isOwner(userId) {
      return userId === this.rights.getOwnerId();
    }

    /**
     * Check if this calendar is public
     * @returns {boolean} return true if the calendar is public
     */
    function isPublic() {
      return !!this.rights.getPublicRight();
    }

    /**
     * Check if user has read rights on this calendar
     * @param userId
     * @returns {boolean} return true if the calendar is public
     */
    function isReadable(userId) {
      return this.isWritable(userId) ||
        this.rights.getShareeRight(userId) === CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ ||
        this.rights.getPublicRight() === CAL_CALENDAR_PUBLIC_RIGHT.READ;
    }

    /**
     * Check if this calendar has been shared by another user
     * Note: if userId is the calendar owner, it doesn't have sharee right, so isShared will return false.
     * @param userId
     * @returns {boolean} return true if userId has sharee right on this calendar
     */
    function isShared(userId) {
      return !!this.rights.getShareeRight(userId);
    }

    /**
     * Check if user has write rights on this calendar
     * @param userId
     * @returns {boolean} return true if the calendar is public
     */
    function isWritable(userId) {
      return this.isAdmin(userId) ||
        this.rights.getShareeRight(userId) === CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ_WRITE ||
        this.rights.getPublicRight() === CAL_CALENDAR_PUBLIC_RIGHT.READ_WRITE;
    }
  }
})();
