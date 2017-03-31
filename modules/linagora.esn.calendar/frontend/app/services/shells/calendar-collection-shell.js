(function() {
  'use strict';

  angular.module('esn.calendar')
         .factory('CalendarCollectionShell', CalendarCollectionShellFactory);

  function CalendarCollectionShellFactory($q, $log, _, calPathBuilder, CalendarRightShell, session, userAPI, CAL_CALENDAR_PUBLIC_RIGHTS, CAL_DEDAULT_EVENT_COLOR, CAL_DEFAULT_CALENDAR_ID, CAL_CALENDAR_RIGHT, CAL_CALENDAR_SHARED_RIGHT) {
    /**
     * A shell that wraps an caldav calendar component.
     * Note that href is the unique identifier and id is the calendarId inside the calendarHomeId
     * @param {Object} calendar            The caldav calendar component.
     * @param {Object} extendedProperties  Object of additional properties like:
     */
    function CalendarCollectionShell(calendar) {
      this.name = calendar['dav:name'] || 'Events';
      this.color = calendar['apple:color'] || CAL_DEDAULT_EVENT_COLOR;
      this.description = calendar['caldav:description'] || '';
      this.href = calendar._links.self.href;
      this.id = this.href.split('/').pop().split('.').shift();
      this.selected = this.id === CAL_DEFAULT_CALENDAR_ID;

      this.acl = calendar.acl;
      this.invite = calendar.invite;
      this.rights = addRightsForSharedCalendar(calendar);
      this.readOnly = checkReadOnly(this.rights, session.user._id);
    }

    CalendarCollectionShell.prototype.isShared = isShared;
    CalendarCollectionShell.prototype.isPublic = isPublic;
    CalendarCollectionShell.prototype.isOwner = isOwner;
    CalendarCollectionShell.prototype.getOwner = getOwner;

    CalendarCollectionShell.toDavCalendar = toDavCalendar;
    CalendarCollectionShell.from = from;
    CalendarCollectionShell.buildHref = buildHref;

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

    function addRightsForSharedCalendar(calendar) {
      if (calendar.invite && calendar.acl) {
       return new CalendarRightShell(calendar.acl, calendar.invite);
      }
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
     * Check if this calendar is public
     * @returns {boolean} return true if the calendar is public
     */
    function isPublic() {
      var publicRight = this.rights.getPublicRight();

      return CAL_CALENDAR_PUBLIC_RIGHTS.indexOf(publicRight) > -1;
    }

    /**
     * Get the owner of the calendar
     * @returns {boolean} return the owner of the calendar
     */
    function getOwner() {
      var self = this;

      if (self.rights) {
        var calendarInvitesIds = _.keys(self.rights.getUsersEmails());
        var calendarOwnerId;

        calendarInvitesIds.some(function(userId) {
          if (self.isOwner(userId)) {
            calendarOwnerId = userId;

            return true;
          }
        });

        if (calendarOwnerId) {
          return userAPI.user(calendarOwnerId).then(function(response) {
            return response.data;
          });
        }

        $log.error('error when searching the calendar owner from a shared calendar or public calendar');
      } else {
        $log.error('the calendar does not have rights');
      }

      return $q.when({});
    }

    /**
     * Check if the user is the owner of the calendar
     * @returns {boolean} return true if the user is the owner of the calendar
     */
    function isOwner(userId) {
      var rights = this.rights.getUserRight(userId);

      return rights === CAL_CALENDAR_RIGHT.ADMIN;
    }

    function checkReadOnly(rights, userId) {
      if (rights) {
        return ([CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ, CAL_CALENDAR_SHARED_RIGHT.SHAREE_FREE_BUSY].indexOf(rights.getShareeRight(userId)) > -1) ||
          rights.getUserRight(userId) === CAL_CALENDAR_RIGHT.PUBLIC_READ;
      }

      return false;
    }
  }
})();
