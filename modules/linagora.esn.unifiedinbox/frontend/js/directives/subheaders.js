'use strict';

angular.module('linagora.esn.unifiedinbox')

  .directive('composerSubheader', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/composer/subheader.html'
    };
  })

  .directive('configurationIndexSubheader', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/configuration/subheader.html'
    };
  })

  .directive('addFolderSubheader', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/configuration/folders/add/subheader.html'
    };
  })

  .directive('editFolderSubheader', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/configuration/folders/edit/subheader.html'
    };
  })

  .directive('inboxSubheaderCloseButton', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/partials/subheader/close-button.html'
    };
  });
