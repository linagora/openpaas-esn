(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .directive('contactCategoryLetter', contactCategoryLetter);

  function contactCategoryLetter() {
    return {
      restrict: 'E',
      template: '{{headerDisplay.categoryLetter}}',
      controller: 'contactCategoryLetterController'
    };
  }
})(angular);
