(function() {
  'use strict';

  angular.module('esn.calendar')
         .component('calOpenEventOnClick', {
           controller: function($element, calOpenEventForm) {
             var self = this;

             $element.on('click', function() {
               calOpenEventForm(self.event);
             });
           },
           bindings: {
             event: '='
           }
        });
})();
