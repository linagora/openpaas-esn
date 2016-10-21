(function() {
  'use strict';

  angular.module('esn.calendar')
         .factory('calendarCurrentView', calendarCurrentView);

  calendarCurrentView.$inject = [
    '$location',
    'calMoment',
    'screenSize',
    'CALENDAR_AVAILABLE_VIEWS'
  ];

  function calendarCurrentView($location, calMoment, screenSize, CALENDAR_AVAILABLE_VIEWS) {
    var currentView = null;

    var service = {
      set: set,
      get: get,
      getMiniCalendarView: getMiniCalendarView,
      setMiniCalendarView: setMiniCalendarView,
      isCurrentViewAroundDay: isCurrentViewAroundDay
    };

    return service;

    ////////////

    function set(view) {
      currentView = view;
      var firstDayOfView = view.name === 'month' ? calMoment(view.start).add(7, 'days').startOf('month') : view.start;

      $location.search({
        viewMode: view.name,
        start: firstDayOfView.format('YYYY-MM-DD')
      });
    }

    function get() {
      var view = {};

      var getParam = currentView || $location.search();
      if (getParam.viewMode && CALENDAR_AVAILABLE_VIEWS.indexOf(getParam.viewMode) !== -1) {
        view.name = getParam.viewMode;
      } else if (getParam.name) {
        view.name = getParam.name;
      } else if (screenSize.is('xs, sm')) {
        // on mobile we force the 'agendaThreeDays' view
        view.name = CALENDAR_AVAILABLE_VIEWS[3];
      }

      var day = calMoment(getParam.start);

      if (getParam.start && day.isValid()) {
        view.start = day;
      }

      view.title = getParam.title;
      view.end = getParam.end;

      return view;
    }

    var miniCalendarView;

    function setMiniCalendarView(view) {
      miniCalendarView = view;
    }

    function getMiniCalendarView() {
      return miniCalendarView;
    }

    function isCurrentViewAroundDay(day) {
      var view = get();

      if (view.start && view.end) {
        var start = view.start;
        var end = view.end;

        //becarefull the end property of the view object returned by fullCalendar
        //is exclusive https://fullcalendar.io/docs/views/View_Object/
        return day.isBetween(start, end, 'day', '[)');
      }

      return false;
    }
  }
})();
