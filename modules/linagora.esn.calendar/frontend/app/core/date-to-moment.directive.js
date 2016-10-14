
(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('calDateToMoment', calDateToMoment);

  calDateToMoment.$inject = ['$parse', 'calMoment'];

  function calDateToMoment($parse, calMoment) {
    var directive = {
      restrict: 'A',
      require: 'ngModel',
      link: link
    };

    return directive;

    ////////////

    function link(scope, element, attrs, ngModel) { // eslint-disable-line
      /**
       * Ensure that we only are using calMoment type of date in our code.
       * It only strip the time if we are dealing with an allday event,
       * because angular-strap date-picker only send back a datetime date format
       * like "Sun Oct 11 2015 02:00:00 GMT+0200 (CEST)"
       */
      ngModel.$parsers.unshift(ensureModelHasCalMoment);

      function ensureModelHasCalMoment(value) {
        var result = $parse(attrs.isAllDay)(scope) ? calMoment(value).stripTime() : calMoment(value);

        return result.isValid() ? result : undefined;
      }
    }
  }

})();
