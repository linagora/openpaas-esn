(function() {
  'use strict';

  angular.module('esn.calendar')
         .factory('calendarCurrentView', calendarCurrentView);

  function calendarCurrentView($location, $log, calMoment, matchmedia, CAL_AVAILABLE_VIEWS, SM_XS_MEDIA_QUERY) {
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

    /**
     * Save the view of fullCalendar. It will save the intervalStart and intervalEnd of it because start and end are not revelant for us
     * @param {ViewObject} - See https://fullcalendar.io/docs/views/View_Object/
     */
    function set(view) {
      currentView = {
        start: view.intervalStart,
        end: view.intervalEnd,
        name: view.name,
        title: view.title
      };

      saveCurrentViewInUrl();
    }

    function saveCurrentViewInUrl() {
      $location.search({
        viewMode: currentView.name,
        start: currentView.start.format('YYYY-MM-DD'),
        end: currentView.end.format('YYYY-MM-DD')
      });
    }

    function restoreCurrentViewFromUrl() {
      var getParam = $location.search();
      var view = {};

      if (getParam.viewMode && CAL_AVAILABLE_VIEWS.indexOf(getParam.viewMode) !== -1) {
        view.name = getParam.viewMode;
      } else if (matchmedia.is(SM_XS_MEDIA_QUERY)) {
        view.name = CAL_AVAILABLE_VIEWS[3];
      }

      ['start', 'end'].forEach(function(name) {
        if (getParam[name]) {
          var day = calMoment(getParam[name]);
          if (day.isValid()) {
            view[name] = day;
          }
        }
      });

      return view;
    }

    /**
     * Return the previous view saved if there were not, it try to restore it from the URL
     * @return {start: moment, end: moment, name: String} - (the start date is inclusive whereas the end date is exclusive like on FullCalendar view object)
     */
    function get() {
      return currentView || restoreCurrentViewFromUrl();
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

      $log.warn('view information is incomplete return false by convention');

      return false;
    }
  }
})();
