'use strict';

angular.module('esn.notification', ['ui.notify', 'angularMoment'])
  .factory('notificationFactory', ['notificationService', function(notificationService) {
    function weakInfo(title, text) {
      var stack_bottomright = {'dir1': 'up', 'dir2': 'left', 'push': 'top'};

      notificationService.notify({
        title: title,
        text: text,
        nonblock: {
          nonblock: true,
          nonblock_opacity: 0.2
        },
        addclass: 'stack-bottomright',
        stack: stack_bottomright,
        type: 'info',
        delay: 3000,
        styling: 'fontawesome'
      });
    }
    function strongInfo(title, text) {
      var stack_topright = {'dir1': 'down', 'dir2': 'left', 'push': 'top'};

      notificationService.notify({
        title: title,
        text: text,
        addclass: 'stack_topright',
        stack: stack_topright,
        hide: false,
        styling: 'fontawesome'
      });
    }

    /**
     * Notification with confirm/cancel dialog
     *
     * @param {string} title The notification title
     * @param {string} text The notification text
     * @param {object} data The parameter for `handlerConfirm` and `handlerCancel`
     * @param {function} handlerConfirm fn like handlerConfirm(data)
     * @param {function} handlerCancel fn like handlerCancel(data)
     */
    function confirm(title, text, data, handlerConfirm, handlerCancel) {
      if (! handlerCancel) {
        handlerCancel = function() {};
      }

      var stack_topright = {'dir1': 'down', 'dir2': 'left', 'push': 'top'};

      (notificationService.notify({
        title: title,
        text: text,
        icon: 'fa fa-phone fa-2 faa-ring animated',
        addclass: 'stack-topright',
        stack: stack_topright,
        hide: false,
        confirm: {
          confirm: true
        },
        styling: 'fontawesome'
      })).get().on('pnotify.confirm', function() {
          handlerConfirm(data);
        }
      ).on('pnotify.cancel', function() {
          handlerCancel(data);
        });
    }
    return {
      weakInfo: weakInfo,
      strongInfo: strongInfo,
      confirm: confirm
    };
  }]);
