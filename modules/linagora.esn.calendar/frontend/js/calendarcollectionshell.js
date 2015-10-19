'use strict';

angular.module('esn.calendar')

  .factory('CalendarCollectionShell', function(ICAL, uuid4) {
    /**
     * A shell that wraps an caldav calendar component.
     * @param {Object} calendar            The caldav calendar component.
     * @param {Object} extendedProperties  Object of additional properties like:
     */
    function CalendarCollectionShell(calendar) {
      var name = calendar['dav:name'] || 'Events';
      var color = calendar['apple:color'] || '#2196f3';
      var description = calendar['caldav:description'] || '';
      var id = '';

      this.getName = function() {
        return name;
      };
      this.getColor = function() {
        return color;
      };
      this.getDescription = function() {
        return description;
      };
      this.getId = function() {
        return id;
      };
    }

    CalendarCollectionShell.toDavCalendar = function toDavCalendar(shell) {
      if (!(shell instanceof CalendarCollectionShell)) {
        shell = CalendarCollectionShell.from(shell);
      }
      return {
        id: shell.getId() || uuid4.generate(),
        'dav:name': shell.getName(),
        'apple:color': shell.getColor(),
        'caldav:description': shell.getDescription()
      };
    };

    CalendarCollectionShell.from = function(object) {
      return new CalendarCollectionShell({
        id: object.id,
        'dav:name': object.name,
        'apple:color': object.color,
        'caldav:description': object.description
      });
    };

    return CalendarCollectionShell;
  });
