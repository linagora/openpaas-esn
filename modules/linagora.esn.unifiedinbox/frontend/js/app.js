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
      .state('unifiedinbox', {
        url: '/unifiedinbox',
        templateUrl: '/unifiedinbox/views/unifiedinbox',
        deepStateRedirect: {
          default: 'unifiedinbox.inbox',
          fn: function() {
            return { state: 'unifiedinbox.inbox' };
          }
        }
      })
      .state('unifiedinbox.compose', {
        url: '/compose',
        views: {
          'main@unifiedinbox': {
            template: '<composer />'
          }
        },
        params: { email: {}, composition: null }
      })
      .state('unifiedinbox.compose.recipients', {
        url: '/:rcpt',
        views: {
          'main@unifiedinbox': {
            templateUrl: '/unifiedinbox/views/composer/fullscreen-edit-form/index',
            controller: 'recipientsFullscreenEditFormController'
          }
        },
        params: { composition: null }
      })
      .state('unifiedinbox.configuration', {
        url: '/configuration',
        views: {
          'main@unifiedinbox': {
            templateUrl: '/unifiedinbox/views/configuration/index',
            controller: 'configurationController'
          }
        }
      })
      .state('unifiedinbox.configuration.folders-add', {
        url: '/folders/add',
        views: {
          'main@unifiedinbox': {
            templateUrl: '/unifiedinbox/views/configuration/folders/add/index',
            controller: 'addFolderController'
          }
        }
      })
      .state('unifiedinbox.configuration.folders-edit', {
        url: '/folders/edit/:mailbox',
        views: {
          'main@unifiedinbox': {
            templateUrl: '/unifiedinbox/views/configuration/folders/edit/index',
            controller: 'editFolderController'
          }
        }
      })
      .state('unifiedinbox.inbox', {
        url: '/inbox',
        views: {
          'main@unifiedinbox': { controller: 'goToInboxController' }
        }
      })
      .state('unifiedinbox.mailbox', {
        url: '/:mailbox',
        views: {
          'main@unifiedinbox': {
            templateUrl: '/unifiedinbox/views/list-emails/index',
            controller: 'listEmailsController'
          }
        }
      })
      .state('unifiedinbox.email', {
        url: '/:mailbox/:emailId',
        views: {
          'main@unifiedinbox': {
            templateUrl: '/unifiedinbox/views/view-email/index',
            controller: 'viewEmailController as ctrl'
          }
        }
      });

    var inbox = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'application-menu-inbox', {priority: 45});
    dynamicDirectiveServiceProvider.addInjection('esn-application-menu', inbox);
  });
