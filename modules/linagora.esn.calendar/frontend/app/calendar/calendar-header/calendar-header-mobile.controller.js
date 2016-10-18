(function() {
  'use strict';

  angular.module('esn.calendar')
         .controller('calendarHeaderMobileController', calendarHeaderMobileController);

  function calendarHeaderMobileController($scope, calendarCurrentView, calMoment) {
    $scope.isCurrentViewAroundToday = isCurrentViewAroundToday;

    //////////////////////

    function isCurrentViewAroundToday() {
      return calendarCurrentView.isCurrentViewAroundDay(calMoment());
    }
  }

})();
