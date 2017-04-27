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
  'esn.configuration',
  'esn.core',
  'linagora.esn.graceperiod',
  'ngAnimate',
  'esn.escape-html',
  'esn.search',
  'esn.async-action',
  'esn.user',
  'esn.session',
  'esn.attachment-list',
  'esn.avatar',
  'esn.highlight',
  'esn.escape-html',
  'esn.registry',
  'material.components.virtualRepeat',
  'esn.module-registry',
  'esn.user-configuration'
])

  .config(function($stateProvider, dynamicDirectiveServiceProvider) {

    function stateOpeningListItem(state) {
      function toggleElementOpened(opening) {
        return function($rootScope) {
          $rootScope.inbox.list.isElementOpened = opening;

          if (opening) {
            $rootScope.inbox.list.infiniteScrollDisabled = opening;
          } else {
            $rootScope.$applyAsync(function() {
              $rootScope.inbox.list.infiniteScrollDisabled = false;
            });
          }
        };
      }

      state.onEnter = toggleElementOpened(true);
      state.onExit = toggleElementOpened(false);

      state.params = state.params || {};
      state.params.item = undefined;

      return state;
    }

    function stateOpeningModal(state, templateUrl, controller) {
      state.resolve = {
        modalHolder: function() {
          return {};
        }
      };
      state.onEnter = function($modal, modalHolder) {
        modalHolder.modal = $modal({
          templateUrl: templateUrl,
          controller: controller,
          controllerAs: 'ctrl',
          backdrop: 'static',
          placement: 'center'
        });
      };
      state.onExit = function(modalHolder) {
        modalHolder.modal.hide();
      };

      return state;
    }

    function stateOpeningRightSidebar(state) {
      function toggleSidebarVisibility(visible) {
        return function($rootScope) {
          $rootScope.inbox.rightSidebar.isVisible = visible;
        };
      }

      state.onEnter = toggleSidebarVisibility(true);
      state.onExit = toggleSidebarVisibility(false);

      return state;
    }

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
          'main@unifiedinbox': {
            template: '<composer />'
          }
        },
        params: { email: {}, compositionOptions: {}, composition: null },
        data: { headerVisibility: false }
      })
      .state('unifiedinbox.compose.recipients', {
        url: '/:recipientsType',
        views: {
          'main@unifiedinbox': {
            templateUrl: '/unifiedinbox/views/composer/fullscreen-edit-form/index',
            controller: 'recipientsFullscreenEditFormController'
          }
        },
        params: { composition: null },
        data: { ignoreSaveAsDraft: true }
      })
      .state('unifiedinbox.inbox.folders', {
        url: '/folders',
        deepStateRedirect: {
          default: 'unifiedinbox.inbox.folders.add',
          fn: function() {
            return { state: 'unifiedinbox.inbox.folders.add' };
          }
        }
      })
      .state('unifiedinbox.inbox.folders.add', stateOpeningModal({
        url: '/add',
        params: { mailbox: null }
      }, '/unifiedinbox/views/folders/add/index', 'addFolderController'))
      .state('unifiedinbox.inbox.folders.edit', stateOpeningModal({
        url: '/:mailbox'
      }, '/unifiedinbox/views/folders/edit/index', 'editFolderController'))
      .state('unifiedinbox.inbox.folders.edit.delete', stateOpeningModal({
        url: '/delete'
      }, '/unifiedinbox/views/folders/delete/index', 'inboxDeleteFolderController'))
      .state('unifiedinbox.configuration', {
        url: '/configuration',
        deepStateRedirect: {
          default: 'unifiedinbox.configuration.vacation',
          fn: function() {
            return { state: 'unifiedinbox.configuration.vacation' };
          }
        },
        views: {
          'main@unifiedinbox': {
            templateUrl: '/unifiedinbox/views/configuration/index',
            controller: 'inboxConfigurationIndexController'
          }
        },
        data: { headerVisibility: false }
      })
      .state('unifiedinbox.configuration.vacation', {
        url: '/vacation',
        views: {
          'configuration@unifiedinbox.configuration': {
            templateUrl: '/unifiedinbox/views/configuration/vacation/index',
            controller: 'inboxConfigurationVacationController as ctrl'
          }
        },
        params: { vacation: null }
      })
      .state('unifiedinbox.configuration.identities', {
        url: '/identities',
        views: {
          'configuration@unifiedinbox.configuration': {
            template: '<inbox-identities />'
          }
        }
      })
      .state('unifiedinbox.configuration.identities.add', {
        url: '/add',
        views: {
          'main@unifiedinbox': {
            template: '<inbox-identity-form />'
          }
        }
      })
      .state('unifiedinbox.configuration.identities.identity', {
        url: '/:identityId',
        views: {
          'main@unifiedinbox': {
            template: function($stateParams) {
              return '<inbox-identity-form identity-id="' + $stateParams.identityId + '" />';
            }
          }
        }
      })
      .state('unifiedinbox.inbox', {
        url: '/inbox?type&account&context',
        views: {
          'main@unifiedinbox': {
            controller: 'unifiedInboxController as ctrl',
            templateUrl: '/unifiedinbox/views/unified-inbox/index'
          }
        }
      })
      .state('unifiedinbox.inbox.attachments', stateOpeningRightSidebar({
        url: '/attachments',
        views: {
          'sidebar@unifiedinbox.inbox': {
            template: '<inbox-list-sidebar-attachment />'
          }
        }
      }))
      .state('unifiedinbox.inbox.attachments.message', stateOpeningListItem({
        url: '/:emailId',
        views: {
          'preview-pane@unifiedinbox.inbox': {
            templateUrl: '/unifiedinbox/views/email/view/index',
            controller: 'viewEmailController as ctrl'
          }
        },
        data: { headerVisibility: false }
      }))
      .state('unifiedinbox.inbox.move', stateOpeningModal({
        url: '/move',
        params: {
          item: undefined,
          selection: false
        }
      }, '/unifiedinbox/views/email/view/move/index', 'inboxMoveItemController'))
      .state('unifiedinbox.inbox.message', stateOpeningListItem({
        url: '/:emailId',
        views: {
          'preview-pane@unifiedinbox.inbox': {
            templateUrl: '/unifiedinbox/views/email/view/index',
            controller: 'viewEmailController as ctrl'
          }
        },
        data: { headerVisibility: false }
      }))
      .state('unifiedinbox.inbox.message.move', stateOpeningModal({
        url: '/move'
      }, '/unifiedinbox/views/email/view/move/index', 'inboxMoveItemController'))
      .state('unifiedinbox.twitter', {
        url: '/twitter/:username',
        views: {
          'main@unifiedinbox': {
            templateUrl: '/unifiedinbox/views/twitter/list/index',
            controller: 'listTwitterController as ctrl'
          }
        }
      });

    var inbox = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'application-menu-inbox', {priority: 45}),
        attachmentDownloadAction = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'attachment-download-action');

    dynamicDirectiveServiceProvider.addInjection('esn-application-menu', inbox);
    dynamicDirectiveServiceProvider.addInjection('attachments-action-list', attachmentDownloadAction);
  })

  .run(function($q, inboxConfig, inboxProviders, inboxHostedMailMessagesProvider, inboxHostedMailThreadsProvider,
                inboxTwitterDirectMessagesProvider, inboxTwitterMentionsProvider, session, searchProviders, inboxSearchResultsProvider,
                DEFAULT_VIEW) {

    $q.all([
      inboxConfig('view', DEFAULT_VIEW),
      inboxConfig('twitter.tweets')
    ]).then(function(config) {
      var view = config[0],
          twitterTweetsEnabled = config[1];

      inboxProviders.add(view === 'messages' ? inboxHostedMailMessagesProvider : inboxHostedMailThreadsProvider);

      if (twitterTweetsEnabled) {
        session.getProviderAccounts('twitter').forEach(function(account) {
          inboxProviders.add(inboxTwitterMentionsProvider(account.id));
          inboxProviders.add(inboxTwitterDirectMessagesProvider(account.id));
        });
      }
    });

    searchProviders.add(inboxSearchResultsProvider);
  })

  .run(function(newComposerService, listenToPrefixedWindowMessage, IFRAME_MESSAGE_PREFIXES) {
    listenToPrefixedWindowMessage(IFRAME_MESSAGE_PREFIXES.MAILTO, function(emailAddress) {
      newComposerService.open({
          to: [{
            email: emailAddress,
            name: emailAddress
          }]
        }
      );
    });
  })

  .run(function($rootScope) {
    $rootScope.inbox = {
      list: {
        isElementOpened: false,
        infiniteScrollDisabled: false
      },
      rightSidebar: {
        isVisible: false
      },
      vacationActivated: false
    };
  })

  .run(function(inboxHostedMailAttachmentProvider, esnAttachmentListProviders, esnModuleRegistry, INBOX_MODULE_METADATA) {
    esnAttachmentListProviders.add(inboxHostedMailAttachmentProvider);
    esnModuleRegistry.add(INBOX_MODULE_METADATA);
  })

  .run(function(esnScrollListenerService) {
    esnScrollListenerService.bindTo('.inbox-infinite-list .md-virtual-repeat-scroller');
  });
