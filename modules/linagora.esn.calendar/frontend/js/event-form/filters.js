'use strict';

angular.module('esn.calendar')

  .filter('partstat', function() {
    return function(input, partstat) {
      input = input || [];
      var out = input.filter(function(attendee) {
        return attendee.partstat === partstat;
      });
      return out;
    };
  });
