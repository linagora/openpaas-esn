(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('calEventMessageEdition', calEventMessageEdition);

  function calEventMessageEdition() {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/event-message/event-message-edition/event-message-edition.html',
      replace: true,
      controller: 'calEventMessageEditionController'
    };

    return directive;
  }

})();
