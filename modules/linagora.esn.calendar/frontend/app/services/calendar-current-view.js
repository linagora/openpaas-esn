(function() {
  'use strict';

  angular.module('esn.calendar')
         .factory('calendarCurrentView', calendarCurrentView);

  calendarCurrentView.$inject = [
    '$location',
    'fcMoment',
    'screenSize',
    'CALENDAR_AVAILABLE_VIEWS'
  ];

  function calendarCurrentView($location, fcMoment, screenSize, CALENDAR_AVAILABLE_VIEWS) {
    var currentView = null;

    var service = {
      set: set,
      get: get,
      getMiniCalendarView: getMiniCalendarView,
      setMiniCalendarView: setMiniCalendarView
    };

    return service;

    ////////////

    function set(view) {
      currentView = view;
      var firstDayOfView = view.name === 'month' ? fcMoment(view.start).add(7, 'days').startOf('month') : view.start;

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

      var day = fcMoment(getParam.start);

      if (getParam.start && day.isValid()) {
        view.start = day;
      }

      view.title = getParam.title;

      return view;
    }

    var miniCalendarView;

    function setMiniCalendarView(view) {
      miniCalendarView = view;
    }

    function getMiniCalendarView() {
      return miniCalendarView;
    }
  }
})();
