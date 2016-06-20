'use strict';

angular.module('linagora.esn.unifiedinbox')

  .directive('inboxSidebarEmail', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/sidebar/email/menu.html',
      scope: {},
      controller: 'inboxSidebarEmailController'
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
  });
