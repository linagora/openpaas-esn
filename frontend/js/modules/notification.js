'use strict';

angular.module('esn.notification', ['angularMoment', 'esn.escape-html', 'esn.i18n'])

  .factory('notifyService', function($window, escapeHtmlUtils, esnI18nService) {

    function getDefaultSettings(options) {
      var hideCross = options && options.hideCross;
      // Because I want default hideCross value to be false
      hideCross = !!hideCross;
      var template = '<div data-notify="container" class="alert alert-{0} flex-space-between" role="alert">' +
          '<span data-notify="message">{2}</span>' +
          '<a target="_self" class="action-link cancel-task" data-notify="url"></a>' +
          (hideCross ? '' : '<a class="close" data-notify="dismiss"><i class="mdi mdi-close"></i></a>') +
          '</div>';

      return {
        placement: { from: 'bottom', align: 'center'},
        mouse_over: 'pause',
        animate: { enter: 'animated fadeInUp', exit: 'animated fadeOutDown' },
        offset: 0,
        template: template
      };
    }
    function escapeHtmlFlatObject(options) {
      var result = {};

      angular.forEach(options, function(value, key) {
        result[key] = angular.isString(value) ? escapeHtmlUtils.escapeHTML(value) : value;
      });

      return result;
    }

    return function(options, settings) {
      if (options) {
        options.message = options.message ? esnI18nService.translate(options.message).toString() : options.message;
        options.title = options.title ? esnI18nService.translate(options.title).toString() : options.title;
      }

      var notification = $window.$.notify(escapeHtmlFlatObject(options), angular.extend({}, getDefaultSettings(options), settings));
      var update = notification.update;

      notification.update = function(strOrObj, value) {
        return angular.isString(strOrObj) ?
          update.call(this, strOrObj, escapeHtmlUtils.escapeHTML(value)) :
          update.call(this, escapeHtmlFlatObject(strOrObj));
      };

      notification.setCancelAction = function(cancelActionConfig) {
        if (cancelActionConfig && cancelActionConfig.linkText && cancelActionConfig.action) {
          cancelActionConfig.linkText = esnI18nService.translate(cancelActionConfig.linkText).toString();

          notification.$ele.find('a.cancel-task').html(cancelActionConfig.linkText);
          notification.$ele.find('a.cancel-task').click(function() {
            notification.close();
            cancelActionConfig.action();
            notification.$ele.find('a.cancel-task').off('click');
            notification.$ele.find('a.close').off('click');
          });
        }
      };

      notification.setCloseAction = function(closeAction) {
        if (options && !options.hideCross) {
          notification.$ele.find('a.close').click(closeAction);
        }
      };

      return notification;
    };
  })

  .factory('notificationFactory', function(_, notifyService) {
    function notify(type, title, text, delay, options) {
      var animationDelay = 300;
      options = options || {};

      options.delay = options.delay ? options.delay - animationDelay : delay - animationDelay;
      options.z_index = 1061;
      var notificationOptions = _.assign({type: type}, options);

      return notifyService({
        title: title,
        message: text
      }, notificationOptions);
    }

    function weakNotification(type, title, text, options) {
      return notify(type, title, text, 3000, options);
    }

    function strongNotification(type, title, text, options) {
      return notify(type, title, text, 0, options);
    }

    function weakSuccess(title, text, options) {
      return weakNotification('success', title, text, options);
    }

    function weakInfo(title, text, options) {
      return weakNotification('info', title, text, options);
    }

    function weakError(title, text, options) {
      return weakNotification('danger', title, text, options);
    }

    function strongInfo(title, text, options) {
      return strongNotification('info', title, text, options);
    }

    function strongError(title, text, options) {
      return strongNotification('danger', title, text, options);
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
