(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('eventMessageEditionButton', eventMessageEditionButton);

  function eventMessageEditionButton() {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/event-message/event-message-edition-button/event-message-edition-button.html',
      replace: true
    };

    return directive;
  }

})();
