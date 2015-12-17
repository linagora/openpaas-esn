'use strict';

angular.module('esn.calendar')
  .controller('calendarsEditionController', function($scope, $log, $location, headerService, calendars) {
    headerService.subHeader.addInjection('calendars-edition-header', $scope);

    $scope.calendars = calendars;

    $scope.$on('$destroy', function() {
      headerService.resetAllInjections();
    });

    $scope.modify = function(cal) {
      $location.url('/calendar/edit/' + cal.getId());
    };

    $scope.add = function(cal) {
      $location.url('/calendar/add');
    };

    $scope.cancel = function() {
      $location.url('/calendar');
    };
  })
  .directive('calendarsEditionHeader', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/calendar-configuration/calendars-edit-header.html'
    };
  });
