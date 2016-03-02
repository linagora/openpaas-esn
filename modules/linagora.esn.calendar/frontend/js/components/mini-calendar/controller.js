'use strict';

angular.module('esn.calendar')
  .controller('miniCalendarController', function(
        $rootScope,
        $q,
        $timeout,
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
        keepChangeDuringGraceperiod,
        uuid4,
        livenotification,
        CalendarShell,
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

        return keepChangeDuringGraceperiod.wrapEventSource(cal.id, rawSource);
      });

      return miniCalendarService.miniCalendarWrapper(resolved.calendar, _.flatten(eventSources));

    }, function(error) {
      notificationFactory.weakError('Could not retrive user calendars', error.message);
      $log.error('Could not retrieve user calendars', error);
    });

    function bindEventToCalWrapperMethod(angularEventName, calWrapperMethod) {
      return $rootScope.$on(angularEventName, function(angularEvent, data) {
        $q.all({
          calendar: calendarPromise,
          calendarWrapper: calendarWrapperPromise
        }).then(function(resolved) {
          if (data.isRecurring && data.isRecurring()) {
            var getView = resolved.calendar.fullCalendar('getView');
            data.expand(getView.start.clone().subtract(1, 'day'), getView.end.clone().add(1, 'day')).forEach(resolved.calendarWrapper[calWrapperMethod], resolved.calendarWrapper);
          } else {
            resolved.calendarWrapper[calWrapperMethod](data);
          }
        });
      });
    }

    function liveNotificationHandlerOnDeleteAndCancel(msg) {
      calendarWrapperPromise.then(function(calendarWrapper) {
        calendarWrapper.removeEvent(CalendarShell.from(msg.event, {etag: msg.etag, path: msg.eventPath}).id);
      });
    }

    function liveNotificationHandlerOnCreate(msg) {
      var event = CalendarShell.from(msg.event, {etag: msg.etag, path: msg.eventPath});
      $q.all({
        calendar: calendarPromise,
        calendarWrapper: calendarWrapperPromise
      }).then(function(resolved) {
        if (event.isRecurring && event.isRecurring()) {
          var getView = resolved.calendar.fullCalendar('getView');
          event.expand(getView.start.clone().subtract(1, 'day'), getView.end.clone().add(1, 'day')).forEach(resolved.calendarWrapper.addEvent, resolved.calendarWrapper);
        } else {
          resolved.calendarWrapper.addEvent(event);
        }
      });
    }

    function liveNotificationHandlerOnRequestAndUpdate(msg) {
      calendarWrapperPromise.then(function(calendarWrapper) {
        calendarWrapper.modifyEvent(CalendarShell.from(msg.event, {etag: msg.etag, path: msg.eventPath}));
      });
    }

    var sio = livenotification('/calendars');
    sio.on(CALENDAR_EVENTS.WS.EVENT_CREATED, liveNotificationHandlerOnCreate);
    sio.on(CALENDAR_EVENTS.WS.EVENT_REQUEST, liveNotificationHandlerOnRequestAndUpdate);
    sio.on(CALENDAR_EVENTS.WS.EVENT_UPDATED, liveNotificationHandlerOnRequestAndUpdate);
    sio.on(CALENDAR_EVENTS.WS.EVENT_CANCEL, liveNotificationHandlerOnDeleteAndCancel);
    sio.on(CALENDAR_EVENTS.WS.EVENT_DELETED, liveNotificationHandlerOnDeleteAndCancel);

    var unregisterFunctions = [
      bindEventToCalWrapperMethod(CALENDAR_EVENTS.ITEM_ADD, 'addEvent'),
      bindEventToCalWrapperMethod(CALENDAR_EVENTS.ITEM_REMOVE, 'removeEvent'),
      bindEventToCalWrapperMethod(CALENDAR_EVENTS.ITEM_MODIFICATION, 'modifyEvent'),
      bindEventToCalWrapperMethod(CALENDAR_EVENTS.REVERT_MODIFICATION, 'modifyEvent'),

      $rootScope.$on(CALENDAR_EVENTS.HOME_CALENDAR_VIEW_CHANGE, function(event, view) {
        $scope.homeCalendarViewMode = view.name;
        var start = view.name === 'month' ? fcMoment(view.start).add(15, 'days') : view.start;
        calendarPromise.then(selectPeriod.bind(null, start));
      })
    ];

    $scope.$on('$destroy', function() {
      sio.removeListener(CALENDAR_EVENTS.WS.EVENT_CREATED, liveNotificationHandlerOnCreate);
      sio.removeListener(CALENDAR_EVENTS.WS.EVENT_REQUEST, liveNotificationHandlerOnRequestAndUpdate);
      sio.removeListener(CALENDAR_EVENTS.WS.EVENT_UPDATED, liveNotificationHandlerOnRequestAndUpdate);
      sio.removeListener(CALENDAR_EVENTS.WS.EVENT_CANCEL, liveNotificationHandlerOnDeleteAndCancel);
      sio.removeListener(CALENDAR_EVENTS.WS.EVENT_DELETED, liveNotificationHandlerOnDeleteAndCancel);

      unregisterFunctions.forEach(function(unregisterFunction) {
        unregisterFunction();
      });

      unregisterWindowResize();
    });
  });
