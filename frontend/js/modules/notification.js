'use strict';

angular.module('esn.notification', ['angularMoment', 'ngSanitize'])

  .factory('notifyService', function($window, $sanitize) {
    var defaultSettings = {
      placement: { from: 'bottom', align: 'center'},
      mouse_over: 'pause',
      animate: { enter: 'animated fadeInUp', exit: 'animated fadeOutDown' },
      offset: 0,
      template: '<div data-notify="container" class="alert alert-{0} flex-space-between" role="alert">' +
        '<span data-notify="message">{2}</span>' +
        '<a target="_self" class="action-link cancel-task" data-notify="url"></a>' +
        '<a class="close" data-notify="dismiss"><i class="mdi mdi-close"></i></a>' +
      '</div>'
    };
    function sanitizeFlatObject(options) {
      var result = {};

      angular.forEach(options, function(value, key) {
        result[key] = angular.isString(value) ? $sanitize(value) : value;
      });

      return result;
    }

    return function(options, settings) {

      var notification = $window.$.notify(sanitizeFlatObject(options), angular.extend({}, defaultSettings, settings));
      var update = notification.update;

      notification.update = function(strOrObj, value) {
        return angular.isString(strOrObj) ?
          update.call(this, strOrObj, $sanitize(value)) :
          update.call(this, sanitizeFlatObject(strOrObj));
      };

      return notification;
    };
  })

  .factory('notificationFactory', function(notifyService) {
    function notify(type, title, text, delay) {
      var animationDelay = 300;

      return notifyService({
        title: title,
        message: text
      }, {
        type: type,
        delay: delay - animationDelay
      });
    }

    function weakNotification(type, title, text) {
      return notify(type, title, text, 3000);
    }

    function strongNotification(type, title, text) {
      return notify(type, title, text, 0);
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
      strongError: strongError,
      notify: notify
    };

  });
