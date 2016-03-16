'use strict';

angular.module('linagora.esn.unifiedinbox')

  .controller('rootController', function($scope, session, mailboxesService) {
    mailboxesService.assignMailboxesList($scope);

    $scope.getTwitterAccounts = session.getTwitterAccounts;
  })

  .controller('unifiedInboxController', function($state, $scope, $q, _, withJmapClient, jmap, infiniteScrollHelper,
                                                 inboxProviders, headerService) {

    headerService.subHeader.setInjection('unified-view-subheader', $scope);

    $scope.loadMoreElements = infiniteScrollHelper($scope, function(position, limit) {
      return inboxProviders
        .getAll()
        .then(function(providers) {
          return $q.all(providers.map(function(provider) {
            return provider.fetch(provider.defaultContainer)(position, limit)
              .then(function(elements) {
                return elements.map(function(e) { return _.assign(e, { templateUrl: provider.templateUrl }); });
              });
          }));
        })
        .then(function(results) { return _.flatten(results, true); });
    });
  })

  .controller('listController', function($state, $stateParams, inboxConfig, DEFAULT_VIEW) {
    inboxConfig('view', DEFAULT_VIEW).then(function(view) {
      $state.go('unifiedinbox.list.' + view, { mailbox: $stateParams.mailbox });
    });
  })

  .controller('listEmailsController', function($scope, $stateParams, $state, jmap, withJmapClient, Email,
                                               ElementGroupingTool, newComposerService, jmapEmailService,
                                               mailboxesService, infiniteScrollHelper, inboxHostedMailMessagesProvider) {

    $scope.loadMoreElements = infiniteScrollHelper($scope, inboxHostedMailMessagesProvider.fetch($stateParams.mailbox));

    mailboxesService.assignMailbox($stateParams.mailbox, $scope);
  })

  .controller('listThreadsController', function($q, $scope, $stateParams, $state, _, withJmapClient, Email, ElementGroupingTool,
                                                mailboxesService, newComposerService, infiniteScrollHelper,
                                                JMAP_GET_MESSAGES_LIST, ELEMENTS_PER_PAGE) {

    function _assignEmailAndDate(dst) {
      return function(email) {
        _.assign(_.find(dst, { id: email.threadId }), { email: Email(email), date: email.date });
      };
    }

    function _prepareThreadsVariable(data) {
      data[1].forEach(_assignEmailAndDate(data[0]));

      return data[0];
    }

    $scope.loadMoreElements = infiniteScrollHelper($scope, function() {
      return withJmapClient(function(client) {
        return client.getMessageList({
          filter: {
            inMailboxes: [$stateParams.mailbox]
          },
          sort: ['date desc'],
          collapseThreads: true,
          fetchThreads: false,
          fetchMessages: false,
          position: $scope.infiniteScrollPosition,
          limit: ELEMENTS_PER_PAGE
        })
          .then(function(messageList) {
            return $q.all([
              messageList.getThreads({ fetchMessages: false }),
              messageList.getMessages({ properties: JMAP_GET_MESSAGES_LIST })
            ]);
          })
          .then(_prepareThreadsVariable);
      });
    });

    mailboxesService.assignMailbox($stateParams.mailbox, $scope);
  })

  .controller('composerController', function($scope, $stateParams, $q, headerService, notificationFactory,
                                            Composition, jmap, withJmapClient, fileUploadService, $filter,
                                            attachmentUploadService, _, inboxConfig,
                                            DEFAULT_FILE_TYPE, DEFAULT_MAX_SIZE_UPLOAD) {
    var disableImplicitSavesAsDraft = false,
        composition;

    this.getComposition = function() {
      return composition;
    };

    this.initCtrl = function(email) {
      this.initCtrlWithComposition(new Composition(email));
    };

    this.initCtrlWithComposition = function(comp) {
      composition = comp;
      $scope.email = composition.getEmail();
    };

    this.saveDraft = function() {
      disableImplicitSavesAsDraft = true;

      return composition.saveDraft();
    };

    function newAttachment(client, file) {
      var attachment = new jmap.Attachment(client, '', {
        name: file.name,
        size: file.size,
        type: file.type || DEFAULT_FILE_TYPE
      });

      attachment.startUpload = function() {
        var uploadTask = fileUploadService.get(attachmentUploadService).addFile(file, true);

        attachment.upload = {
          progress: 0,
          cancel: uploadTask.cancel
        };
        attachment.status = 'uploading';
        attachment.upload.promise = uploadTask.defer.promise.then(function(task) {
          attachment.status = 'uploaded';
          attachment.error = null;
          attachment.blobId = task.response.blobId;
          attachment.url = task.response.url;

          if (!disableImplicitSavesAsDraft) {
            composition.saveDraftSilently();
          }
        }, function(err) {
          attachment.status = 'error';
          attachment.error = err;
        }, function(uploadTask) {
          attachment.upload.progress = uploadTask.progress;
        });

        return attachment;
      };

      return attachment;
    }

    this.onAttachmentsSelect = function($files) {
      if (!$files || $files.length === 0) {
        return;
      }

      $scope.email.attachments = $scope.email.attachments || [];

      return withJmapClient(function(client) {
        return inboxConfig('maxSizeUpload', DEFAULT_MAX_SIZE_UPLOAD).then(function(maxSizeUpload) {
          var humanReadableMaxSizeUpload = $filter('bytes')(maxSizeUpload);

          $files.forEach(function(file) {
            if (file.size > maxSizeUpload) {
              return notificationFactory.weakError('', 'File ' + file.name + ' ignored as its size exceeds the ' + humanReadableMaxSizeUpload + ' limit');
            }

            $scope.email.attachments.push(newAttachment(client, file).startUpload());
          });
        });
      });
    };

    this.removeAttachment = function(attachment) {
      attachment.upload && attachment.upload.cancel();
      _.pull($scope.email.attachments, attachment);

      composition.saveDraftSilently();
    };

    if ($stateParams.composition) {
      this.initCtrlWithComposition($stateParams.composition);
    } else if ($stateParams.email) {
      this.initCtrl($stateParams.email);
    }

    $scope.isCollapsed = true;
    $scope.summernoteOptions = {
      focus: false,
      airMode: false,
      disableResizeEditor: true,
      toolbar: [
        ['style', ['bold', 'italic', 'underline', 'strikethrough']],
        ['textsize', ['fontsize']],
        ['alignment', ['paragraph', 'ul', 'ol']]
      ]
    };

    $scope.send = function() {
      $scope.isSendingMessage = true;

      if (composition.canBeSentOrNotify()) {
        disableImplicitSavesAsDraft = true;

        $scope.hide();
        composition.send();
      } else {
        $scope.isSendingMessage = false;
      }
    };

  })

  .controller('viewEmailController', function($scope, $stateParams, $state, withJmapClient, jmap, Email, session, asyncAction, emailSendingService, newComposerService, inboxEmailService, JMAP_GET_MESSAGES_VIEW) {

    $scope.mailbox = $stateParams.mailbox;
    $scope.emailId = $stateParams.emailId;

    withJmapClient(function(client) {
      client.getMessages({
        ids: [$scope.emailId],
        properties: JMAP_GET_MESSAGES_VIEW
      }).then(function(messages) {
        $scope.email = Email(messages[0]); // We expect a single message here

        inboxEmailService.markAsRead($scope.email);
      });
    });

    ['reply', 'replyAll', 'forward'].forEach(function(action) {
      this[action] = function() {
        inboxEmailService[action]($scope.email);
      };
    }.bind(this));
  })

  .controller('viewThreadController', function($scope, $stateParams, withJmapClient, Email, Thread, inboxEmailService, inboxThreadService, _, JMAP_GET_MESSAGES_VIEW) {

    withJmapClient(function(client) {
      client
        .getThreads({ids: [$stateParams.threadId], fetchMessages: false})
        .then(function(threads) {
          $scope.thread = threads[0];

          return $scope.thread.getMessages({
            properties: JMAP_GET_MESSAGES_VIEW
          });
        })
        .then(function(messages) { return messages.map(Email); })
        .then(function(emails) {
          $scope.thread = new Thread($scope.thread, emails);
        })
        .then(function() {
          $scope.thread.emails.forEach(function(email, index, emails) {
            email.isCollapsed = !(email.isUnread || index === emails.length - 1);
          });
        })
        .then(function() {
          inboxThreadService.markAsRead($scope.thread);
        });
    });

    ['markAsUnread', 'markAsRead', 'markAsFlagged', 'unmarkAsFlagged', 'moveToTrash'].forEach(function(action) {
      this[action] = function() {
        inboxThreadService[action]($scope.thread);
      };
    }.bind(this));

    ['reply', 'replyAll', 'forward'].forEach(function(action) {
      this[action] = function() {
        inboxEmailService[action](_.last($scope.thread.emails));
      };
    }.bind(this));
  })

  .controller('configurationController', function($scope, mailboxesService) {
    mailboxesService.assignMailboxesList($scope, mailboxesService.filterSystemMailboxes);
  })

  .controller('addFolderController', function($scope, $state, mailboxesService, notificationFactory, asyncJmapAction) {
    mailboxesService.assignMailboxesList($scope);

    $scope.mailbox = {};

    $scope.addFolder = function() {
      if (!$scope.mailbox.name) {
        return notificationFactory.weakError('Error', 'Please enter a valid folder name');
      }

      asyncJmapAction('Creation of folder ' + $scope.mailbox.name, function(client) {
        return client.createMailbox($scope.mailbox.name, $scope.mailbox.parentId);
      }).then(function() {
        $state.go('unifiedinbox');
      });
    };
  })

  .controller('editFolderController', function($scope, $state, $stateParams, $modal, mailboxesService, _, notificationFactory, asyncJmapAction) {
    mailboxesService
      .assignMailboxesList($scope)
      .then(function(mailboxes) {
        $scope.mailbox = _.find(mailboxes, { id: $stateParams.mailbox });
      });

    $scope.editFolder = function() {
      if (!$scope.mailbox.name) {
        return notificationFactory.weakError('Error', 'Please enter a valid folder name');
      }

      asyncJmapAction('Modification of folder ' + $scope.mailbox.name, function(client) {
        return client.updateMailbox($scope.mailbox.id, {
          name: $scope.mailbox.name,
          parentId: $scope.mailbox.parentId
        });
      }).then(function() {
        $state.go('unifiedinbox');
      });
    };

    $scope.confirmationDialog = function() {
      $scope.modal = $modal({scope: $scope, templateUrl: '/unifiedinbox/views/configuration/folders/delete/index', backdrop: 'static', placement: 'center'});
    };

    $scope.deleteFolder = function() {
      asyncJmapAction('Deletion of folder ' + $scope.mailbox.name, function(client) {
        return client.destroyMailbox($scope.mailbox.id);
      }).then(function() {
        $state.go('unifiedinbox');
      });
    };
  })

  .controller('recipientsFullscreenEditFormController', function($scope, $rootScope, $state, $stateParams) {
    if (!$stateParams.recipientsType || !$stateParams.composition || !$stateParams.composition.email) {
      return $state.go('unifiedinbox.compose');
    }

    $scope.recipientsType = $stateParams.recipientsType;
    $scope.recipients = $stateParams.composition.email[$stateParams.recipientsType];

    $scope.backToComposition = function() {
      $state.go('^', { composition: $stateParams.composition });
    };
  })

  .controller('attachmentController', function($window) {
    this.download = function(attachment) {
      $window.open(attachment.url);
    };
  })

  .controller('listTwitterController', function($scope, $stateParams, infiniteScrollHelper, inboxTwitterProvider, session, _) {

    var account = _.find(session.getTwitterAccounts(), { username: $stateParams.username });

    $scope.loadMoreElements = infiniteScrollHelper($scope, inboxTwitterProvider(account.id).fetch());
    $scope.username = account.username;
  });
