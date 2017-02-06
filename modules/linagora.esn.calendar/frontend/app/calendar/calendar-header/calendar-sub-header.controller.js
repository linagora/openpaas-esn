(function() {
  'use strict';

  angular.module('esn.calendar')
         .controller('calendarSubHeaderController', calendarSubHeaderController);

  function calendarSubHeaderController($scope, calendarCurrentView, calMoment) {
    $scope.isCurrentViewAroundToday = isCurrentViewAroundToday;

    //////////////////////

    function isCurrentViewAroundToday() {
      return calendarCurrentView.isCurrentViewAroundDay(calMoment());
    }
  }

})();
