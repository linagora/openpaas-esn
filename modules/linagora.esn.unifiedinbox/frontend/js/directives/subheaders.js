'use strict';

angular.module('linagora.esn.unifiedinbox')

  .directive('unifiedViewSubheader', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/unified-inbox/subheader.html',
      controller: 'inboxListSubheaderController',
      controllerAs: 'ctrl'
    };
  })

  .directive('listTwitterSubheader', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/twitter/list/subheader.html',
      controller: 'inboxListSubheaderController',
      controllerAs: 'ctrl'
    };
  })

  .directive('listEmailsSubheader', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/email/list/subheader.html',
      controller: 'inboxListSubheaderController',
      controllerAs: 'ctrl'
    };
  })

  .directive('viewEmailSubheader', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/email/view/subheader.html'
    };
  })

  .directive('viewThreadSubheader', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/thread/view/subheader.html'
    };
  })

  .directive('composerSubheader', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/composer/subheader.html'
    };
  })

  .directive('inboxConfigurationFolderSubheader', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/configuration/folders/subheader.html'
    };
  })

  .directive('inboxConfigurationVacationSubheader', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/configuration/vacation/subheader.html'
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

  .directive('fullscreenEditFormSubheader', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/composer/fullscreen-edit-form/subheader.html'
    };
  })

  .directive('inboxSubheaderCloseButton', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/partials/subheader/close-button.html'
    };
  })

  .directive('inboxSubheaderBurgerButton', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/partials/subheader/burger-button.html'
    };
  })

  .directive('inboxSubheaderBackButton', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/partials/subheader/back-button.html'
    };
  })

  .directive('inboxSubheaderSaveButton', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/partials/subheader/save-button.html'
    };
  });
