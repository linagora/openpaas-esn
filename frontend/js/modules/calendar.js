'use strict';

angular.module('esn.calendar', ['esn.authentication', 'esn.ical', 'restangular', 'mgcrea.ngStrap.datepicker', 'angularMoment', 'uuid4'])
  .factory('calendarService', ['Restangular', 'moment', 'tokenAPI', 'uuid4', 'ICAL', '$q', '$http', function(Restangular, moment, tokenAPI, uuid4, ICAL, $q, $http) {

    /**
     * A shell that wraps an ical.js VEVENT component to be compatible with
     * fullcalendar's objects.
     *
     * @param {ICAL.Component} vevent        The ical.js VEVENT component.
     */
    function CalendarShell(vevent) {
      this.id = vevent.getFirstPropertyValue('uid');
      this.title = vevent.getFirstPropertyValue('summary');
      this.allDay = vevent.getFirstProperty('dtstart').type === 'date';
      this.start = vevent.getFirstPropertyValue('dtstart').toJSDate();
      this.end = vevent.getFirstPropertyValue('dtend').toJSDate();
    }

    function getCaldavServerURL() {
      if (serverUrlCache) {
        return serverUrlCache.promise;
      }

      serverUrlCache = $q.defer();
      Restangular.one('caldavserver').get().then(
        function(response) {
          serverUrlCache.resolve(response.data.url);
        },
        function(err) {
          serverUrlCache.reject(err);
        }
      );

      return serverUrlCache.promise;
    }

    function configureRequest(method, path, headers, body) {
      return $q.all([tokenAPI.getNewToken(), getCaldavServerURL()]).then(function(results) {
        var token = results[0].data.token, url = results[1];

        headers = headers || {};
        headers.ESNToken = token;

        var config = {
          url: url + '/' + path,
          method: method,
          headers: headers
        };

        if (body) {
          config.data = body;
        }

        return config;
      });
    }

    function request(method, path, headers, body) {
      return configureRequest(method, path, headers, body).then(function(config) {
        return $http(config);
      });
    }

    function shellToICAL(shell) {
      var uid = uuid4.generate();
      var vcalendar = new ICAL.Component('vcalendar');
      var vevent = new ICAL.Component('vevent');
      vevent.addPropertyWithValue('uid', uid);
      vevent.addPropertyWithValue('summary', shell.title);

      var dtstart = ICAL.Time.fromJSDate(shell.startDate);
      var dtend = ICAL.Time.fromJSDate(shell.endDate);
      dtstart.isDate = shell.allday;
      dtend.isDate = shell.allday;

      if (shell.allday) {
        dtend.day++;
      }

      vevent.addPropertyWithValue('dtstart', dtstart);
      vevent.addPropertyWithValue('dtend', dtend);
      vevent.addPropertyWithValue('transp', shell.allday ? 'TRANSPARENT' : 'OPAQUE');
      if (shell.location) {
        vevent.addPropertyWithValue('location', shell.location);
      }
      if (shell.description) {
        vevent.addPropertyWithValue('description', shell.description);
      }
      vcalendar.addSubcomponent(vevent);
      return vcalendar;
    }

    function getEvent(path) {
      var headers = { Accept: 'application/calendar+json' };
      return request('get', '/' + path, headers).then(function(response) {
        var vcalendar = new ICAL.Component(response.data);
        var vevent = vcalendar.getFirstSubcomponent('vevent');
        return new CalendarShell(vevent);
      });
    }

    function list(calendarPath, start, end, timezone) {
      var req = {
        match: {
           start: moment(start).format('YYYYMMDD[T]HHmmss'),
           end: moment(end).format('YYYYMMDD[T]HHmmss')
        },
        scope: {
          calendars: [calendarPath]
        }
      };

      return request('post', '/json/queries/time-range', null, req).then(function(response) {
        var results = [];
        response.data.forEach(function(vcaldata) {
          var vcalendar = new ICAL.Component(vcaldata);
          var vevents = vcalendar.getAllSubcomponents('vevent');
          vevents.forEach(function(vevent) {
            results.push(new CalendarShell(vevent));
          });
        });
        return results;
      });
    }

    function create(calendarPath, vcalendar) {
      var vevent = vcalendar.getFirstSubcomponent('vevent');
      if (!vevent) {
        return $q.reject(new Error('Missing VEVENT in VCALENDAR'));
      }
      var uid = vevent.getFirstPropertyValue('uid');
      if (!uid) {
        return $q.reject(new Error('Missing UID in VEVENT'));
      }

      var headers = { 'Content-Type': 'application/json+calendar' };
      var body = vcalendar.toJSON();

      return request('put', calendarPath + '/' + uid + '.ics', headers, body).then(function(response) {
        if (response.status !== 201) {
          return $q.reject(response);
        }
        return response;
      });
    }

    var serverUrlCache = null;
    return {
      list: list,
      create: create,
      getEvent: getEvent,

      shellToICAL: shellToICAL
    };
  }])
  .controller('createEventController', ['$scope', '$rootScope', '$alert', 'calendarService', 'moment', '$timeout', function($scope, $rootScope, $alert, calendarService, moment, $timeout) {
    $scope.rows = 1;

    function getNewDate() {
      var date = new Date();
      date.setHours(date.getHours() + Math.round(date.getMinutes() / 60));
      date.setMinutes(0);
      date.setSeconds(0);
      return date;
    }

    function getNewEndDate() {
      var date = getNewDate();
      date.setHours(date.getHours() + Math.round(date.getMinutes() / 60) + 1);
      date.setMinutes(0);
      date.setSeconds(0);
      return date;
    }

    function isSameDay() {
      var startDay = new Date($scope.event.startDate.getFullYear(), $scope.event.startDate.getMonth(), $scope.event.startDate.getDate());
      var endDay = new Date($scope.event.endDate.getFullYear(), $scope.event.endDate.getMonth(), $scope.event.endDate.getDate());
      return moment(startDay).isSame(moment(endDay));
    }

    $scope.event = {
      startDate: getNewDate(),
      endDate: getNewEndDate(),
      allday: false
    };

    $scope.expand = function() {
      $scope.rows = 5;
    };

    $scope.shrink = function() {
      if (!$scope.event.description) {
        $scope.rows = 1;
      }
    };

    $scope.displayError = function(err) {
      $alert({
        content: err,
        type: 'danger',
        show: true,
        position: 'bottom',
        container: '.message-panel > .error',
        duration: '3',
        animation: 'am-fade'
      });
    };

    $scope.createEvent = function() {
      if (!$scope.event.title || $scope.event.title.trim().length === 0) {
        $scope.displayError('You must define an event title');
        return;
      }

      if (!$scope.activitystreamUuid) {
        $scope.displayError('You can not post to an unknown stream');
        return;
      }
      var event = $scope.event;
      var path = '/calendars/' + $scope.calendarId + '/events';
      var vcalendar = calendarService.shellToICAL(event);
      calendarService.create(path, vcalendar).then(function(response) {
        $rootScope.$emit('message:posted', {
          activitystreamUuid: $scope.activitystreamUuid,
          id: response.headers('ESN-Message-Id')
        });
        $scope.resetEvent();
        $scope.show('whatsup');
      }, function(err) {
        $scope.displayError('Error while creating the event: ' + err.statusText);
        console.error(err.data);
      });
    };

    $scope.resetEvent = function() {
      $scope.rows = 1;
      $scope.event = {
        startDate: getNewDate(),
        endDate: getNewEndDate(),
        diff: 1,
        allday: false
      };
    };

    $scope.getMinDate = function() {
      if ($scope.event.startDate) {
        var date = new Date($scope.event.startDate.getTime());
        date.setDate($scope.event.startDate.getDate() - 1);
        return date;
      }
      return null;
    };

    $scope.onStartDateChange = function() {
      var startDate = moment($scope.event.startDate);
      var endDate = moment($scope.event.endDate);

      if (startDate.isAfter(endDate)) {
        startDate.add(1, 'hours');
        $scope.event.endDate = startDate.toDate();
      }
    };

    $scope.onStartTimeChange = function() {

      if (isSameDay()) {
        var startDate = moment($scope.event.startDate);
        var endDate = moment($scope.event.endDate);

        if (startDate.isAfter(endDate) || startDate.isSame(endDate)) {
          startDate.add($scope.event.diff || 1, 'hours');
          $scope.event.endDate = startDate.toDate();
        } else {
          endDate = moment(startDate);
          endDate.add($scope.event.diff || 1, 'hours');
          $scope.event.endDate = endDate.toDate();
        }
      }
    };

    $scope.onEndTimeChange = function() {

      if (isSameDay()) {
        var startDate = moment($scope.event.startDate);
        var endDate = moment($scope.event.endDate);

        if (endDate.isAfter(startDate)) {
          $scope.event.diff = $scope.event.endDate.getHours() - $scope.event.startDate.getHours();
        } else {
          $scope.event.diff = 1;
          endDate = moment(startDate);
          endDate.add($scope.event.diff, 'hours');
          $scope.event.endDate = endDate.toDate();
        }
      }
    };

  }])
  .directive('eventEdition', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/message/event/eventEdition.html'
    };
  });
