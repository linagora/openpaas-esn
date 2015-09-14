'use strict';

angular.module('esn.notification', ['angularMoment'])
  .factory('notificationFactory', function() {
    var bottom_right = { from: 'bottom', align: 'right'},
        top_right = { from: 'top', align: 'right' };

    function notify(type, title, text, placement, delay) {
      return $.notify({
        title: title,
        message: text
      }, {
        type: type,
        placement: placement,
        delay: delay
      });
    }

    function weakNotification(type, title, text) {
      return notify(type, title, text, bottom_right, 3000);
    }

    function strongNotification(type, title, text) {
      return notify(type, title, text, top_right, 0);
    }

    function weakSuccess(title, text) {
      return weakNotification('success', title, text);
    }

    function weakInfo(title, text) {
      return weakNotification('info', title, text);
    }

    function weakError(title, text) {
      return weakNotification('danger', title, text);
    }

    function strongInfo(title, text) {
      return strongNotification('info', title, text);
    }

    function strongError(title, text) {
      return strongNotification('danger', title, text);
    }

    return {
      weakInfo: weakInfo,
      weakError: weakError,
      weakSuccess: weakSuccess,
      strongInfo: strongInfo,
      strongError: strongError
    };

  });
