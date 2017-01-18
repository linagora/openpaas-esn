(function() {
  'use strict';

  angular.module('esn.calendar')
    .factory('gracePeriodResponseHandler', gracePeriodResponseHandlerFactory);

  function gracePeriodResponseHandlerFactory(responseHandler) {
    return responseHandler(202, function(response) {
      return response.data.id;
    });
  }

})();
