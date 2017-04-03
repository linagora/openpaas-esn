(function() {
  'use strict';

  angular.module('esn.calendar')
    .factory('gracePeriodResponseHandler', gracePeriodResponseHandlerFactory);

  function gracePeriodResponseHandlerFactory(calHttpResponseHandler) {
    return calHttpResponseHandler(202, function(response) {
      return response.data.id;
    });
  }

})();
