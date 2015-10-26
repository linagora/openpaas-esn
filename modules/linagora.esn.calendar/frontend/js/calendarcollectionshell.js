'use strict';

angular.module('esn.calendar')

  .factory('CalendarCollectionShell', function(pathBuilder) {
    /**
     * A shell that wraps an caldav calendar component.
     * Note that href is the unique identifier and id is the calendarId inside the calendarHomeId
     * @param {Object} calendar            The caldav calendar component.
     * @param {Object} extendedProperties  Object of additional properties like:
     */
    function CalendarCollectionShell(calendar) {
      var name = calendar['dav:name'] || 'Events';
      var color = calendar['apple:color'] || '#2196f3';
      var description = calendar['caldav:description'] || '';
      var href = calendar._links.self.href;
      var id = href.split('/').pop().split('.').shift();

      this.getName = function() {
        return name;
      };
      this.getColor = function() {
        return color;
      };
      this.getDescription = function() {
        return description;
      };
      this.getHref = function() {
        return href;
      };
      this.getId = function() {
        return id;
      };
    }

    /**
     * Return a dav:calendar used in body of request about calendars
     * Note that it's only used when creating a calendar for now.
     * @param  {Object} shell  a CalendarCollectionShell or an object like {href: '', name: '', color: '', description: ''}
     * @return {Object}        {'dav:name': '', 'apple:color': '', 'caldav:description': ''}
     */
    CalendarCollectionShell.toDavCalendar = function toDavCalendar(shell) {
      if (!(shell instanceof CalendarCollectionShell)) {
        shell = CalendarCollectionShell.from(shell);
      }
      return {
        id: shell.getId(),
        'dav:name': shell.getName(),
        'apple:color': shell.getColor(),
        'caldav:description': shell.getDescription()
      };
    };

    /**
     * Take an object and return a CalendarCollectionShell
     * @param  {Object} object like {href: '', name: '', color: '', description: ''}
     * @return {CalendarCollectionShell}        the new CalendarCollectionShell
     */
    CalendarCollectionShell.from = function(object) {
      return new CalendarCollectionShell({
        _links: {self: {href: object.href}},
        'dav:name': object.name,
        'apple:color': object.color,
        'caldav:description': object.description
      });
    };

    CalendarCollectionShell.buildHref = function(calendarHomeId, calendarId) {
      return pathBuilder.forCalendarId(calendarHomeId, calendarId);
    };

    return CalendarCollectionShell;
  });
