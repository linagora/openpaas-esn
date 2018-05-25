(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .directive('contactListCards', contactListCards);

  function contactListCards() {
    return {
      restrict: 'E',
      templateUrl: '/contact/app/contact/list/contact-list-cards.html'
    };
  }
})(angular);
