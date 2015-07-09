'use strict';

angular.module('linagora.esn.graceperiod')

  .factory('gracePeriodAPI', function(Restangular) {
    return Restangular.withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setBaseUrl('/graceperiod/api');
      RestangularConfigurer.setFullResponse(true);
    });
  })

  .factory('gracePeriodService', function(gracePeriodAPI, notifyOfGracedRequest) {
    function cancel(id) {
      return gracePeriodAPI.one('tasks').one(id).remove();
    }

    return {
      grace: notifyOfGracedRequest,
      cancel: cancel
    };
  })

  .factory('notifyOfGracedRequest', function(GRACE_DELAY, notificationService, $q, $rootScope) {
    var stack = {
      dir1: 'up',
      dir2: 'right',
      spacing1: 10,
      spacing2: 10
    };

    function appendCancelLink(text, linkText) {
      return text + ' <a class="cancel-task">' + linkText + '</a>';
    }

    return function(text, linkText, delay) {
      return $q(function(resolve, reject) {
        var notification = notificationService.notify({
          type: 'success',
          text: appendCancelLink(text, linkText),
          stack: stack,
          addclass: 'graceperiod text-center',
          animate_speed: 'normal',
          width: false,
          delay: delay || GRACE_DELAY,
          styling: 'fontawesome',
          buttons: {
            sticker: false
          },
          after_close: function() {
            $rootScope.$apply(function() {
              resolve({cancelled: false});
            });
          }
        });

        notification.get().find('a.cancel-task').click(function() {
          $rootScope.$apply(function() {
            resolve({cancelled: true,
            success: function() {
              notification.remove(false);
            },
            error: function(textToDisplay) {
              notification.update({
                type: 'error',
                text: textToDisplay,
                delay: 5000
              });
            }});
          });
        });
      });
    };
  });
