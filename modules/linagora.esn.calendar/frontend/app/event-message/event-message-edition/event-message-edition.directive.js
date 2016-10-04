(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('eventMessageEdition', eventMessageEdition);

  function eventMessageEdition() {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/event-message/event-message-edition/event-message-edition.html',
      replace: true,
      controller: 'eventMessageEditionController'
    };

    return directive;
  }

})();
