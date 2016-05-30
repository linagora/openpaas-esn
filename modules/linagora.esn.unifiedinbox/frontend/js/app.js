'use strict';

angular.module('linagora.esn.unifiedinbox', [
  'restangular',
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
  'esn.url',
  'esn.background',
  'esn.aggregator',
  'esn.provider',
  'esn.dragndrop',
  'esn.autolinker-wrapper',
  'linagora.esn.graceperiod'
])

  .config(function($stateProvider, dynamicDirectiveServiceProvider) {
    $stateProvider
      .state('unifiedinbox', {
        url: '/unifiedinbox',
        templateUrl: '/unifiedinbox/views/home',
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
        params: { email: {}, compositionOptions: {}, composition: null, previousState: { name: 'unifiedinbox.inbox' } }
      })
      .state('unifiedinbox.compose.recipients', {
        url: '/:recipientsType',
        views: {
          'root@unifiedinbox': {
            templateUrl: '/unifiedinbox/views/composer/fullscreen-edit-form/index',
            controller: 'recipientsFullscreenEditFormController'
          }
        },
        params: { composition: null },
        data: { ignoreSaveAsDraft: true }
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
          'main@unifiedinbox': {
            controller: 'unifiedInboxController',
            templateUrl: '/unifiedinbox/views/unified-inbox/index'
          }
        }
      })
      .state('unifiedinbox.twitter', {
        url: '/twitter/:username',
        views: {
          'main@unifiedinbox': {
            templateUrl: '/unifiedinbox/views/twitter/list/index',
            controller: 'listTwitterController as ctrl'
          }
        }
      })
      .state('unifiedinbox.list', {
        url: '/:mailbox',
        views: {
          'main@unifiedinbox': { controller: 'listController' }
        }
      })
      .state('unifiedinbox.list.messages', {
        url: '/messages',
        views: {
          'main@unifiedinbox': {
            templateUrl: '/unifiedinbox/views/email/list/index',
            controller: 'listEmailsController as ctrl'
          }
        }
      })
      .state('unifiedinbox.list.messages.message', {
        url: '/:emailId',
        views: {
          'main@unifiedinbox': {
            templateUrl: '/unifiedinbox/views/email/view/index',
            controller: 'viewEmailController as ctrl'
          }
        }
      })
      .state('unifiedinbox.list.threads', {
        url: '/threads',
        views: {
          'main@unifiedinbox': {
            templateUrl: '/unifiedinbox/views/thread/list/index',
            controller: 'listThreadsController as ctrl'
          }
        }
      })
      .state('unifiedinbox.list.threads.thread', {
        url: '/:threadId',
        views: {
          'main@unifiedinbox': {
            templateUrl: '/unifiedinbox/views/thread/view/index',
            controller: 'viewThreadController as ctrl'
          }
        }
      });

    var inbox = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'application-menu-inbox', {priority: 45}),
        attachmentDownloadAction = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'attachment-download-action');

    dynamicDirectiveServiceProvider.addInjection('esn-application-menu', inbox);
    dynamicDirectiveServiceProvider.addInjection('attachments-action-list', attachmentDownloadAction);
  })

  .run(function($q, inboxConfig, inboxProviders, inboxHostedMailMessagesProvider, inboxHostedMailThreadsProvider,
                inboxTwitterProvider, session, DEFAULT_VIEW) {

    $q.all([
      inboxConfig('view', DEFAULT_VIEW),
      inboxConfig('twitter.tweets')
    ]).then(function(config) {
      var view = config[0],
          twitterTweetsEnabled = config[1];

      inboxProviders.add(view === 'messages' ? inboxHostedMailMessagesProvider : inboxHostedMailThreadsProvider);

      if (twitterTweetsEnabled) {
        session.getTwitterAccounts().forEach(function(account) {
          inboxProviders.add(inboxTwitterProvider(account.id));
        });
      }
    });
  })

  .run(function(newComposerService, listenToPrefixedWindowMessage, MAILTO_URL_MESSAGE_PREFIX) {
    listenToPrefixedWindowMessage(MAILTO_URL_MESSAGE_PREFIX, function(emailAddress) {
      newComposerService.open({
          to: [{
            email: emailAddress,
            name: emailAddress
          }]
        }
      );
    });
  });
