(function() {
  'use strict';

  angular.module('esn.user-notification')
    .controller('EsnUserNotificationListController', EsnUserNotificationListController);

  function EsnUserNotificationListController(_, esnPaginationtionProviderBuilder, esnUserNotificationService, ELEMENTS_PER_PAGE) {
    var self = this;
    var options = {
      limit: self.elementsPerPage || ELEMENTS_PER_PAGE,
      offset: 0
    };

    self.$onInit = $onInit;

    function $onInit() {
      getUserNotificationProvider();
    }

    function getUserNotificationProvider() {
      esnPaginationtionProviderBuilder(self, 'UserNotificationList', esnUserNotificationService.getListFunctions(), options);
    }
  }
})();
