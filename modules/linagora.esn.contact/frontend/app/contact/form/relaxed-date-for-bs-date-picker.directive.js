(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
  .directive('relaxedDateForBsDatepicker', relaxedDateForBsDatepicker);

  function relaxedDateForBsDatepicker(
    $dateFormatter,
    CONTACT_DATE_FORMAT
  ) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, element, attrs, controller) {
        element.attr('placeholder', CONTACT_DATE_FORMAT);

        // Change bs-datepick behavior and put the string birthday in input
        scope.$applyAsync(function() {
          controller.$parsers = [];

          controller.$render = function() {
            element.val($dateFormatter.formatDate(controller.$viewValue, CONTACT_DATE_FORMAT));
          };

          if (angular.isString(scope.contact.birthday)) {
            element.val(scope.contact.birthday);
          }
        });
      }
    };
  }
})(angular);
