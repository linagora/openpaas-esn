(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .controller('inboxListHeaderController', function(moment, _) {
      var self = this,
          groups = [
            { name: 'Today', dateFormat: 'shortTime', accepts: isToday },
            { name: 'Yesterday', dateFormat: 'shortTime', accepts: isYesterday },
            { name: 'This Week', dateFormat: 'EEE d', accepts: isThisWeek },
            { name: 'This Month', dateFormat: 'EEE d', accepts: isThisMonth },
            { name: 'Older than a month', dateFormat: 'mediumDate', accepts: _.constant(true) }
          ];

      self.$onChanges = $onChanges;

      /////

      function $onChanges(bindings) {
        if (!bindings.item || !bindings.item.currentValue) {
          return;
        }

        _.forEach(groups, function(group) {
          if (group.accepts(moment(), moment(bindings.item.currentValue.date))) {
            self.group = group;

            return false;
          }
        });
      }

      function isToday(now, targetMoment) {
        return now.startOf('day').isBefore(targetMoment);
      }

      function isYesterday(now, targetMoment) {
        return now.subtract(1, 'days').startOf('day').isBefore(targetMoment);
      }

      function isThisWeek(now, targetMoment) {
        return now.startOf('week').isBefore(targetMoment);
      }

      function isThisMonth(now, targetMoment) {
        return now.startOf('month').isBefore(targetMoment);
      }
    });

})();
