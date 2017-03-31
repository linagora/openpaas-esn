(function() {
  'use strict';

  angular.module('esn.calendar')
    .factory('calendarExploredPeriodService', calendarExploredPeriodService);

  function calendarExploredPeriodService(_) {
    var exploredCalsPeriods = {};

    var service = {
      registerExploredPeriod: registerExploredPeriod,
      reset: reset,
      getUnexploredPeriodsInPeriod: getUnexploredPeriodsInPeriod
    };

    return service;

    ////////////

    function min(a, b) {
      return a.isBefore(b, 'day') ? a : b;
    }

    function max(a, b) {
      return a.isAfter(b, 'day') ? a : b;
    }

    function merge(a, b) {
      return {
        start: min(a.start, b.start),
        end: max(a.end, b.end)
      };
    }

    //return the part of a that is not in b
    function difference(a, b) {
      var result = [];

      if (a.start.isBefore(b.start, 'day')) {
        result.push({
          start: a.start,
          end: min(a.end, b.start.clone().subtract(1, 'day'))
        });
      }

      if (a.end.isAfter(b.end, 'day')) {
        result.push({
          start: max(a.start, b.end.clone().add(1, 'day')),
          end: a.end
        });
      }

      return result;
    }

    function periodAreConnected(a, b) {
      if (a.start.isAfter(b.start)) {
        return periodAreConnected(b, a);
      }

      return b.start.isBefore(a.end.clone().add(2, 'day'), 'day');
    }

    function getExploredPeriods(calId) {
      exploredCalsPeriods[calId] = exploredCalsPeriods[calId] || [];

      return exploredCalsPeriods[calId];
    }

    function registerExploredPeriod(calId, period) {
      var exploredPeriods = getExploredPeriods(calId);

      if (!exploredPeriods.length) {
        exploredPeriods.push(period);

        return;
      }

      var insertionIndex = 0;
      var numOfMergedPeriod = 0;

      exploredPeriods.forEach(function(exploredPeriod, i) {
        if (exploredPeriod.end.isBefore(period.start.clone().subtract(1, 'day'), 'day')) {
          insertionIndex = i + 1;
        } else if (periodAreConnected(exploredPeriod, period)) {
          period = merge(exploredPeriod, period);
          numOfMergedPeriod++;
        }
      });

      exploredPeriods.splice(insertionIndex, numOfMergedPeriod, period);
    }

    function reset(calId) {
      if (calId) {
        delete exploredCalsPeriods[calId];
      } else {
        exploredCalsPeriods = {};
      }
    }

    function getUnexploredPeriodsInPeriod(calId, period) {
      var exploredPeriods = getExploredPeriods(calId);

      return exploredPeriods.reduce(function(prev, exploredPeriod) {
        return _.flatten(prev.map(function(unexploredPeriod) {
          return difference(unexploredPeriod, exploredPeriod);
        }));
      }, [period]);
    }
  }

})();
