(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('calFriendlifyEndDate', calFriendlifyEndDate);

  calFriendlifyEndDate.$inject = ['$parse', 'calMoment'];

  function calFriendlifyEndDate($parse, calMoment) {
    var directive = {
      restrict: 'A',
      require: 'ngModel',
      link: link,
      priority: 20
    };

    return directive;

    ////////////

    function link(scope, element, attrs, ngModel) { // eslint-disable-line
      /**
       * Ensure that the view has a userfriendly end date output by removing 1 day to the event.end
       * if it is an allDay. We must do it because fullCalendar uses exclusive date/time end date.
       * Also it is not necessary to do it if the end date is same day than the start date.
       */
      ngModel.$formatters.push(subtractOneDayToView);

      /**
       * Ensure that if editedEvent is allDay, we had 1 days to event.end because fullCalendar and
       * caldav has exclusive date/time end date.
       */
      ngModel.$parsers.push(addOneDayToModel);

      /**
       * bsDatepicker sets the element value directly from the internal
       * $dateValue, but we want the above formatters to run, so we use the view
       * value instead. We also use this opportunity to update the internal
       * $dateValue.
       */
      ngModel.$render = render;

      ////////////

      function subtractOneDayToView(value) {
        if (value && $parse(attrs.isAllDay)(scope)) {
          var valueToMoment = calMoment(new Date(value));

          value = valueToMoment.subtract(1, 'days').format('YYYY/MM/DD');
        }

        return value;
      }

      function addOneDayToModel(value) {
        if (value && $parse(attrs.isAllDay)(scope)) {
          value = value.clone().add(1, 'days');
        }

        return value;
      }

      function render() {
        ngModel.$dateValue = new Date(ngModel.$viewValue);
        element.val(ngModel.$viewValue);
      }
    }
  }

})();
