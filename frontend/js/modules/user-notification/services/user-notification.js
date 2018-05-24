(function(angular) {
  'use strict';

  angular.module('esn.user-notification')
    .factory('EsnUserNotification', EsnUserNotification);

  function EsnUserNotification() {

    function UserNotification(data) {
      angular.extend(this, data);
    }

    UserNotification.prototype.setAcknowledged = function(acknowledged) {
      var self = this;

      self.acknowledged = acknowledged;
    };

    return UserNotification;
  }
})(angular);
