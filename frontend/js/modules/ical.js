/*global ICAL */

'use strict';

angular.module('esn.ical', [])
  .factory('icalParserService', ['ICALFactory', function(ICALFactory) {

    /**
     * Parse ical to jcal
     */
    function parseICS(ics) {
      return ICALFactory.get().parse(ics);
    }

    return {
      parseICS: parseICS
    };
  }])
  .factory('ICALFactory', function() {
    return {
      get: function() {
        return ICAL;
      }
    };
  });
