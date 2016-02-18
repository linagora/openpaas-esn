'use strict';

angular.module('linagora.esn.unifiedinbox', [
  'esn.router',
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
  'esn.settings-overlay',
  'esn.desktop-utils',
  'esn.form.helper',
  'esn.infinite-list',
  'esn.url'
  ])
  .config(function($stateProvider, dynamicDirectiveServiceProvider) {
    $stateProvider
      .state('unifiedinbox', {
        url: '/unifiedinbox',
        templateUrl: '/unifiedinbox/views/unifiedinbox',
        controller: 'rootController as ctrl',
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
          'root@unifiedinbox': {
            template: '<composer />'
          }
        },
        params: { email: {}, composition: null, previousState: { name: 'unifiedinbox.inbox' } }
      })
      .state('unifiedinbox.compose.recipients', {
        url: '/:rcpt',
        views: {
          'root@unifiedinbox': {
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
      .state('unifiedinbox.messages', {
        url: '/messages/:mailbox',
        views: {
          'main@unifiedinbox': {
            templateUrl: '/unifiedinbox/views/list-emails/index',
            controller: 'listEmailsController as ctrl'
          }
        }
      })
      .state('unifiedinbox.messages.message', {
        url: '/:emailId',
        views: {
          'main@unifiedinbox': {
            templateUrl: '/unifiedinbox/views/view-email/index',
            controller: 'viewEmailController as ctrl'
          }
        }
      })
      .state('unifiedinbox.threads', {
        url: '/:mailbox',
        views: {
          'main@unifiedinbox': {
            templateUrl: '/unifiedinbox/views/list-threads/index',
            controller: 'listThreadsController as ctrl'
          }
        }
      })
      .state('unifiedinbox.threads.thread', {
        url: '/:threadId',
        views: {
          'main@unifiedinbox': {
            templateUrl: '/unifiedinbox/views/view-thread/index',
            controller: 'viewThreadController as ctrl'
          }
        }
      });

    var inbox = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'application-menu-inbox', {priority: 45});
    dynamicDirectiveServiceProvider.addInjection('esn-application-menu', inbox);

    var attachmentDownloadAction = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'attachment-download-action');
    dynamicDirectiveServiceProvider.addInjection('attachments-action-list', attachmentDownloadAction);
  });
