'use strict';

angular.module('linagora.esn.unifiedinbox', [
  'ui.router',
  'esn.jmap-client-wrapper',
  'angularMoment',
  'esn.notification',
  'esn.iframe-resizer-wrapper',
  'esn.file',
  'esn.box-overlay',
  'esn.profile',
  'esn.summernote-wrapper',
  'esn.attendee',
  'esn.fullscreen-edit-form',
  'esn.scroll',
  'op.dynamicDirective',
  'esn.header',
  'esn.offline-wrapper',
  'matchMedia',
  'esn.lodash-wrapper',
  'esn.settings-overlay'
  ])
  .config(function($stateProvider, dynamicDirectiveServiceProvider) {
    $stateProvider
      .state('/unifiedinbox', {
        url: '/unifiedinbox',
        templateUrl: '/unifiedinbox/views/unifiedinbox',
        controller: 'homeController'
      })
      .state('/unifiedinbox/compose', {
        url: '/unifiedinbox/compose',
        template: '<composer/>',
        params: {email: {}}
      })
      .state('/unifiedinbox/configuration', {
        url: '/unifiedinbox/configuration',
        templateUrl: '/unifiedinbox/views/configuration/index',
        controller: 'configurationController'
      })
      .state('/unifiedinbox/configuration/folders/add', {
        url: '/unifiedinbox/configuration/folders/add',
        templateUrl: '/unifiedinbox/views/configuration/folders/add/index',
        controller: 'addFolderController'
      })
      .state('/unifiedinbox/configuration/folders/edit/:mailbox', {
        url: '/unifiedinbox/configuration/folders/edit/:mailbox',
        templateUrl: '/unifiedinbox/views/configuration/folders/edit/index',
        controller: 'editFolderController'
      })
      .state('/unifiedinbox/:mailbox', {
        url: '/unifiedinbox/:mailbox',
        templateUrl: '/unifiedinbox/views/list-emails/index',
        controller: 'listEmailsController'
      })
      .state('/unifiedinbox/:mailbox/:emailId', {
        url: '/unifiedinbox/:mailbox/:emailId',
        templateUrl: '/unifiedinbox/views/view-email/index',
        controller: 'viewEmailController'
      });

    var inbox = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'application-menu-inbox', {priority: 45});
    dynamicDirectiveServiceProvider.addInjection('esn-application-menu', inbox);
  });
