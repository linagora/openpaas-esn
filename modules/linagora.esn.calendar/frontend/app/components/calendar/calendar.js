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

  function esnCalendarController($window, $element, $log, _, CALENDAR_RESIZE_DEBOUNCE_DELAY) {
    var self = this;
    var div = $element.children();

    var windowJQuery = angular.element($window);
    var debouncedWindowResize = _.debounce(function() {
      div.fullCalendar('render');
    }, CALENDAR_RESIZE_DEBOUNCE_DELAY);

    //otherwise if when the directive is initialized hidden
    //when the window is enlarger and the mini-calendar appear
    //the calendar is not render
    windowJQuery.on('resize', debouncedWindowResize);

    self.$onDestroy = function() {
      windowJQuery.off('resize', debouncedWindowResize);
    };

    self.$onInit = function() {
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

      div.fullCalendar(config);
    };
  }
})();
