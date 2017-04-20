(function() {
  'use strict';

  angular.module('esn.calendar')
    .component('calOpenEventFormOnClick', {
       bindings: {
         event: '='
       },
       controller: CalOpenEventFormOnClickController
     }
   );

    function CalOpenEventFormOnClickController($element, calOpenEventForm) {
      var self = this;

      $element.on('click', function() {
        calOpenEventForm(self.event);
      });
    }
})();
