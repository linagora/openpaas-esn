'use strict';

angular.module('esn.calendar')
  .controller('miniCalendarController', function(
        $rootScope,
        $q,
        $window,
        $scope,
        $log,
        fcMoment,
        UI_CONFIG,
        CALENDAR_EVENTS,
        uiCalendarConfig,
        session,
        calendarEventSource,
        calendarService,
        miniCalendarService,
        notificationFactory,
        calendarCurrentView,
        cachedEventSource,
        uuid4,
        _
  ) {

    var calendarDeffered = $q.defer();
    var calendarPromise = calendarDeffered.promise;
    var userId = session.user._id;

    $scope.miniCalendarConfig = angular.extend({}, UI_CONFIG.calendar,
        UI_CONFIG.miniCalendar);
    $scope.miniCalendarId = uuid4.generate();
    $scope.events = [];

    var currentView = calendarCurrentView.get();
    $scope.homeCalendarViewMode = currentView.name || UI_CONFIG.calendar.defaultView;

    var prev = calendarPromise.then.bind(calendarPromise, function(cal) {
      cal.fullCalendar('prev');
    });

    var next = calendarPromise.then.bind(calendarPromise, function(cal) {
      cal.fullCalendar('next');
    });

    $scope.swipeLeft = next;
    $scope.swipeRight = prev;

    var miniCalendarDisplay = false;

    $rootScope.$on(CALENDAR_EVENTS.MINI_CALENDAR.TOGGLE, function() {
      miniCalendarDisplay = !miniCalendarDisplay;
    });

    $rootScope.$on(CALENDAR_EVENTS.VIEW_TRANSLATION, function(event, action) {
      if (miniCalendarDisplay) {
        (action === 'prev' ? prev : next)();
      }
    });

    function selectPeriod(day, calendar) {
      day = fcMoment(day).stripTime();
      calendar.fullCalendar('gotoDate', day);
      switch ($scope.homeCalendarViewMode) {
        case 'agendaWeek':
          var week = miniCalendarService.getWeekAroundDay($scope.miniCalendarConfig, day);
          calendar.fullCalendar('select', week.firstWeekDay, week.nextFirstWeekDay);
          break;
        case 'agendaDay':
          var nextDay = fcMoment(day).add(1, 'days');
          calendar.fullCalendar('select', day, nextDay);
          break;
        case 'month':
          calendar.fullCalendar('unselect');
          break;
        default:
          throw 'unknown view mode : ' + $scope.homeCalendarViewMode;
      }
    }

    calendarPromise.then(selectPeriod.bind(null, currentView.start || fcMoment()));

    $scope.miniCalendarConfig.select = function(start, end, jsEvent) {
      if (jsEvent) {
        calendarPromise.then(selectPeriod.bind(null, start));
        $rootScope.$broadcast(CALENDAR_EVENTS.MINI_CALENDAR.DATE_CHANGE, start);
        $rootScope.$broadcast(CALENDAR_EVENTS.MINI_CALENDAR.TOGGLE);
      }
    };

    function windowResize() {
      uiCalendarConfig.calendars[$scope.miniCalendarId].fullCalendar('render');
    }

    var windowJQuery = angular.element($window);

    //otherwise if when the directive is initialized hidden
    //when the window is enlarger and the mini-calendar appear
    //the calendar is not render
    windowJQuery.on('resize', windowResize);

    function unregisterWindowResize() {
      windowJQuery.off('resize', windowResize);
    }

    var calendarResolved = false;

    $scope.miniCalendarConfig.viewRender = function(view) {
      if (!calendarResolved) {
        calendarDeffered.resolve(uiCalendarConfig.calendars[$scope.miniCalendarId]);
        unregisterWindowResize();
        calendarResolved = true;
      }
      $rootScope.$broadcast(CALENDAR_EVENTS.MINI_CALENDAR.VIEW_CHANGE, view);
    };

    $scope.miniCalendarConfig.eventClick = function(event) {
      $rootScope.$broadcast(CALENDAR_EVENTS.MINI_CALENDAR.DATE_CHANGE, event.start);
      $rootScope.$broadcast(CALENDAR_EVENTS.MINI_CALENDAR.TOGGLE);
    };

    var calendarWrapperPromise = $q.all({
      calendar: calendarPromise,
      calendars: calendarService.listCalendars(userId)
    }).then(function(resolved) {
      var eventSources = resolved.calendars.map(function(cal) {
        var rawSource = calendarEventSource(cal.href, function(error) {
          notificationFactory.weakError('Could not retrieve event sources', error.message);
          $log.error('Could not retrieve event sources', error);
        });

        return cachedEventSource.wrapEventSource(cal.id, rawSource);
      });

      return miniCalendarService.miniCalendarWrapper(resolved.calendar, _.flatten(eventSources));

    }, function(error) {
      notificationFactory.weakError('Could not retrive user calendars', error.message);
      $log.error('Could not retrieve user calendars', error);
    });

    function rerenderMiniCalendar() {
      calendarWrapperPromise.then(function(calendarWrapper) {
        calendarWrapper.rerender();
      });
    }

    var unregisterFunctions = [
      $rootScope.$on(CALENDAR_EVENTS.ITEM_ADD, rerenderMiniCalendar),
      $rootScope.$on(CALENDAR_EVENTS.ITEM_REMOVE, rerenderMiniCalendar),
      $rootScope.$on(CALENDAR_EVENTS.ITEM_MODIFICATION, rerenderMiniCalendar),
      $rootScope.$on(CALENDAR_EVENTS.REVERT_MODIFICATION, rerenderMiniCalendar),

      $rootScope.$on(CALENDAR_EVENTS.HOME_CALENDAR_VIEW_CHANGE, function(event, view) {
        $scope.homeCalendarViewMode = view.name;
        var start = view.name === 'month' ? fcMoment(view.start).add(15, 'days') : view.start;
        calendarPromise.then(selectPeriod.bind(null, start));
      })
    ];

    $scope.$on('$destroy', function() {

      unregisterFunctions.forEach(function(unregisterFunction) {
        unregisterFunction();
      });

      unregisterWindowResize();
    });
  });
