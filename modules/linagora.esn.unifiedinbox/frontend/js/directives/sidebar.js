'use strict';

angular.module('linagora.esn.unifiedinbox')

  .directive('inboxSidebarEmail', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/sidebar/email/menu.html',
      controller: 'inboxSidebarEmailController',
      controllerAs: 'ctrl'
    };
  })

  .directive('inboxSidebarTwitter', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/sidebar/twitter/menu.html',
      scope: {},
      controller: 'inboxSidebarTwitterController'
    };
  })

  .directive('inboxSidebarConfigurationButton', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/sidebar/configuration/configuration-button.html'
    };
  })

  .directive('inboxSidebarNewFolderButton', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/sidebar/configuration/new-folder-button.html'
    };
  })

  .directive('inboxSidebarAccountUnavailable', function() {
    return {
      restrict: 'E',
      scope: {
        account: '='
      },
      templateUrl: '/unifiedinbox/views/sidebar/common/account-unavailable.html'
    };
  });
