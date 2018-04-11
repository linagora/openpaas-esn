(function() {
  'use strict';

  angular.module('esn.message').controller('messageActionsController', messageActionsController);

  function messageActionsController() {
    var self = this;

    self.remove = remove;

    function remove() {
      console.log('Remove message', self.message);
    }
  }

})(angular);
