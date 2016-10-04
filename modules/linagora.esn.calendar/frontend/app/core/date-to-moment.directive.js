
(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('dateToMoment', dateToMoment);

  dateToMoment.$inject = ['$parse', 'fcMoment'];

  function dateToMoment($parse, fcMoment) {
    var directive = {
      restrict: 'A',
      require: 'ngModel',
      link: link
    };

    return directive;

    ////////////

    function link(scope, element, attrs, ngModel) { // eslint-disable-line
      /**
       * Ensure that we only are using fcMoment type of date in our code.
       * It only strip the time if we are dealing with an allday event,
       * because angular-strap date-picker only send back a datetime date format
       * like "Sun Oct 11 2015 02:00:00 GMT+0200 (CEST)"
       */
      ngModel.$parsers.unshift(ensureFCMomentToModel);

      function ensureFCMomentToModel(value) {
        var result = $parse(attrs.isAllDay)(scope) ? fcMoment(value).stripTime() : fcMoment(value);

        return result.isValid() ? result : undefined;
      }
    }
  }

})();
