(function() {
  'use strict';

  angular.module('esn.calendar')
         .filter('partstat', partstat);

  function partstat() {
    function filter(input, partstat) {
      input = input || [];
      var out = input.filter(function(attendee) {
        return attendee.partstat === partstat;
      });

      return out;
    }

    return filter;
  }

})();
