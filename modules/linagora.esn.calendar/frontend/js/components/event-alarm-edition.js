'use strict';
angular.module('esn.calendar')

  .constant('TRIGGER', [{
    value: '-PT1M',
    label: '1 minute'
  }, {
    value: '-PT5M',
    label: '5 minutes'
  }, {
    value: '-PT10M',
    label: '10 minutes'
  }, {
    value: '-PT15M',
    label: '15 minutes'
  }, {
    value: '-PT30M',
    label: '30 minutes'
  }, {
    value: '-PT1H',
    label: '1 hour'
  }, {
    value: '-PT2H',
    label: '2 hours'
  }, {
    value: '-PT5H',
    label: '5 hours'
  }, {
    value: '-PT12H',
    label: '12 hours'
  }, {
    value: '-PT1D',
    label: '1 day'
  }, {
    value: '-PT2D',
    label: '2 days'
  }, {
    value: '-PT1W',
    label: '1 week'
  }])
  .directive('eventAlarmEdition', function(session, TRIGGER) {
    function link(scope) {
      scope.setEventAlarm = function() {
        scope.event.alarm = {
          trigger: scope.trigger,
          attendee: session.user.emails[0]
        };
      };
      scope.TRIGGER = TRIGGER;
    }

    return {
      restrict: 'E',
      scope: {
        event: '='
      },
      replace: true,
      templateUrl: '/calendar/views/components/event-alarm-edition.html',
      link: link
    };
  });
