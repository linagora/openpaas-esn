(function() {
  'use strict';

  angular.module('esn.calendar')
  /**
   * This component display a fullcalendar
   */
    .component('esnCalendar', {
      restrict: 'E',
      replace: false,
      template: '<div></div>',
      controller: 'esnCalendarController',
      bindToController: true,
      bindings: {
        config: '<',
        calendarReady: '<'
      }
    })
    .controller('esnCalendarController', esnCalendarController);

  esnCalendarController.$inject = [
    '$window',
    '$element',
    '$log',
    '_'
  ];

  function esnCalendarController($window, $element, $log, _) {
    var self = this;
    var alreadyInit = false;
    var alreadyRender = false;
    var div = $element.children();

    function windowResize() {
      !alreadyRender && div.fullCalendar('render');
      alreadyRender = true;
    }

    var windowJQuery = angular.element($window);

    //otherwise if when the directive is initialized hidden
    //when the window is enlarger and the mini-calendar appear
    //the calendar is not render
    windowJQuery.on('resize', windowResize);

    self.$onDestroy = function() {
      windowJQuery.off('resize', windowResize);
    };

    self.$onChanges = function(value, oldValue) {
      if (alreadyInit) {
        $log.error('You can not change config');

        return;
      } else if (self.config && self.calendarReady) {
        var config = _.clone(self.config);

        config.viewRender = function() {
          self.config.viewRender && self.config.viewRender.apply(this, arguments);

          self.calendarReady({
            fullCalendar: function() {
              try {
                return div.fullCalendar.apply(div, arguments);
              } catch (e) {
                $log.error(e);
              }
            },
            offset: div.offset.bind(div)
          });
        };
        alreadyInit = true;
        div.fullCalendar(config);
      }
    };
  }
})();
