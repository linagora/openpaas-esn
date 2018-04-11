(function(angular) {
  'use strict';

  angular.module('esn.message').factory('messageHelpers', messageHelpers);

  function messageHelpers() {
    return {
      isMessageCreator: isMessageCreator
    };

    function isMessageCreator(user, message) {
      return user._id === message.author._id;
    }
  }
})(angular);
