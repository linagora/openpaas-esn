(function(angular) {
  'use strict';

  angular.module('esn.user-notification')
    .factory('EsnUserNotificationDefault', EsnUserNotificationDefault);

  function EsnUserNotificationDefault(esnRestangular, EsnUserNotification) {

    function DefaultUserNotification(data) {
      EsnUserNotification.call(this, data);
    }

    DefaultUserNotification.prototype.setAcknowledged = function(acknowledged) {
      var self = this;

      return esnRestangular
        .one('user')
        .one('notifications', self._id)
        .one('acknowledged')
        .customPUT({value: acknowledged})
        .then(function() {
          self.acknowledged = acknowledged;
        });
    };

    return DefaultUserNotification;
  }
})(angular);
