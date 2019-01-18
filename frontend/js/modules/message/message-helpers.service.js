(function(angular) {
  'use strict';

  angular.module('esn.message').factory('esnMessageHelpers', esnMessageHelpers);

  function esnMessageHelpers() {
    return {
      isMessageCreator: isMessageCreator
    };

    function isMessageCreator(user, message) {
      return user._id === message.author._id;
    }
  }
})(angular);
