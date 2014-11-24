'use strict';

angular.module('esn.calendar', ['mgcrea.ngStrap.datepicker', 'angularMoment'])
  .factory('calendarService', ['$q', function($q) {

    function list(start, end, timezone) {
      var result = [
        // TODO temporary event for effects.
        {title: 'October Barcamp', start: new Date(2014, 9, 13), end: new Date(2014, 9, 17), color: '#f00'}
      ].filter(function(e) {
        return (e.start >= start && e.end <= end);
      });

      var defer = $q.defer();
      defer.resolve(result);
      return defer.promise;
    }

    function create(event) {
      var defer = $q.defer();
      defer.reject({message: 'Create is not implemented'});
      return defer.promise;
    }

    function remove(event) {
      var defer = $q.defer();
      defer.reject({message: 'Remove is not implemented'});
      return defer.promise;
    }

    function update(event) {
      var defer = $q.defer();
      defer.reject({message: 'Update is not implemented'});
      return defer.promise;
    }

    function accept(event) {
      var defer = $q.defer();
      defer.reject({message: 'Accept is not implemented'});
      return defer.promise;
    }

    function decline(event) {
      var defer = $q.defer();
      defer.reject({message: 'Decline is not implemented'});
      return defer.promise;
    }


    return {
      list: list,
      create: create,
      remove: remove,
      update: update,
      accept: accept,
      decline: decline
    };
  }])
  .controller('createEventController', ['$scope', '$rootScope', '$alert', 'calendarService', 'moment', function($scope, $rootScope, $alert, calendarService, moment) {
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
        container: '#error',
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

      calendarService.create(event).then(function(response) {
        $rootScope.$emit('message:posted', {
          activitystreamUuid: $scope.activitystreamUuid,
          id: response.id
        });
        $scope.resetEvent();
      }, function(err) {
        $scope.displayError('Error while creating the event ' + err.message);
      });
    };

    $scope.resetEvent = function() {
      $scope.rows = 1;
      $scope.event.startDate = getNewDate();
      $scope.event.endDate = getNewEndDate();
      $scope.event.diff = 1;
      $scope.event.allday = false;
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
