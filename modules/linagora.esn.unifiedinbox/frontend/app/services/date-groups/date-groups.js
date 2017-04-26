(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .factory('inboxDateGroups', function(moment, _) {
      var groups = [
        { name: 'Today', dateFormat: 'shortTime', accepts: isToday },
        { name: 'Yesterday', dateFormat: 'EEE', accepts: isYesterday },
        { name: 'This week', dateFormat: 'EEE', accepts: isThisWeek },
        { name: 'Last week', dateFormat: 'MMM d', accepts: isLastWeek },
        { name: 'This month', dateFormat: 'MMM d', accepts: isThisMonth },
        { name: 'Last month', dateFormat: 'MMM d', accepts: isLastMonth },
        { name: 'This year', dateFormat: 'MMM d', accepts: isThisYear },
        { name: 'Old messages', dateFormat: 'shortDate', accepts: _.constant(true) }
      ];

      return {
        getGroup: getGroup
      };

      /////

      function getGroup(date) {
        return _.find(groups, function(group) {
          return group.accepts(moment(), moment(date));
        });
      }

      function isToday(now, targetMoment) {
        return now.startOf('day').isBefore(targetMoment);
      }

      function isYesterday(now, targetMoment) {
        return now.subtract(1, 'day').startOf('day').isBefore(targetMoment);
      }

      function isThisWeek(now, targetMoment) {
        return now.startOf('week').isBefore(targetMoment);
      }

      function isLastWeek(now, targetMoment) {
        return now.startOf('week').subtract(1, 'week').isBefore(targetMoment);
      }

      function isThisMonth(now, targetMoment) {
        return now.startOf('month').isBefore(targetMoment);
      }

      function isLastMonth(now, targetMoment) {
        return now.startOf('month').subtract(1, 'month').isBefore(targetMoment);
      }

      function isThisYear(now, targetMoment) {
        return now.startOf('year').isBefore(targetMoment);
      }
    });

})();
