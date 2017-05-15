(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .filter('inboxQuote', function() {
      return function(text) {
        if (!text) {
          return text;
        }

        return text.trim().replace(/(^|\n)/g, '$1> ');
      };
    });

})();
