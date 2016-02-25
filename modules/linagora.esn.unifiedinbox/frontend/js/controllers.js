'use strict';

angular.module('linagora.esn.unifiedinbox')

  .controller('rootController', function($scope, mailboxesService) {
    mailboxesService.assignMailboxesList($scope);
  })

  .controller('goToInboxController', function($state, withJmapClient, jmap) {
    withJmapClient(function(client) {
      client.getMailboxWithRole(jmap.MailboxRole.INBOX).then(function(mailbox) {
        $state.go('unifiedinbox.threads', { mailbox: mailbox.id });
      });
    });
  })

  .controller('listEmailsController', function($scope, $stateParams, $state, jmap, withJmapClient, Email, ElementGroupingTool, newComposerService, headerService, jmapEmailService, mailboxesService, JMAP_GET_MESSAGES_LIST) {

    function searchForMessages() {
      withJmapClient(function(client) {
        client
          .getMessageList({
            filter: {
              inMailboxes: [$scope.mailbox.id]
            },
            collapseThreads: false,
            fetchMessages: false,
            position: 0,
            limit: 100
          })
          .then(function(messageList) {
            return messageList.getMessages({
              properties: JMAP_GET_MESSAGES_LIST
            });
          })
          .then(function(messages) { return messages.map(Email); })
          .then(function(emails) {
            $scope.groupedEmails = new ElementGroupingTool($scope.mailbox.id, emails).getGroupedElements();
          });
      });
    }

    headerService.subHeader.setInjection('list-emails-subheader', $scope);

    this.openEmail = function(email) {
      if (email.isDraft) {
        newComposerService.openDraft(email.id);
      } else {
        $state.go('unifiedinbox.messages.message', {
          mailbox: $scope.mailbox.id,
          emailId: email.id
        });
      }
    };

    mailboxesService
      .assignMailbox($stateParams.mailbox, $scope)
      .then(searchForMessages);
  })

  .controller('listThreadsController', function($q, $scope, $stateParams, $state, _, withJmapClient, Email, ElementGroupingTool,
                                                headerService, mailboxesService, newComposerService, JMAP_GET_MESSAGES_LIST, ELEMENTS_PER_PAGE) {

    var position = 0,
        groups = new ElementGroupingTool($stateParams.mailbox);

    this.openThread = function(thread) {
      if (thread.email.isDraft) {
        newComposerService.openDraft(thread.email.id);
      } else {
        $state.go('unifiedinbox.threads.thread', {
          mailbox: $scope.mailbox.id,
          threadId: thread.id
        });
      }
    };

    function _assignEmailAndDate(dst) {
      return function(email) {
        _.assign(_.find(dst, { id: email.threadId }), { email: Email(email), date: email.date });
      };
    }

    function _prepareThreadsVariable(data) {
      data[1].forEach(_assignEmailAndDate(data[0]));

      return data[0];
    }

    $scope.infiniteScrollDisabled = false;
    $scope.loadMoreElements = function() {
      if ($scope.infiniteScrollDisabled || $scope.infiniteScrollCompleted) {
        return $q.reject();
      }

      $scope.infiniteScrollDisabled = true;

      return withJmapClient(function(client) {
        return client.getMessageList({
          filter: {
            inMailboxes: [$stateParams.mailbox]
          },
          sort: ['date desc'],
          collapseThreads: true,
          fetchThreads: false,
          fetchMessages: false,
          position: position,
          limit: ELEMENTS_PER_PAGE
        })
          .then(function(messageList) {

            return $q.all([
              messageList.getThreads({ fetchMessages: false }),
              messageList.getMessages({ properties: JMAP_GET_MESSAGES_LIST })
            ]);
          })
          .then(_prepareThreadsVariable)
          .then(function(threads) {
            groups.addAll(threads);

            if (threads.length < ELEMENTS_PER_PAGE) {
              $scope.infiniteScrollCompleted = true;

              return $q.reject();
            }
          })
          .then(function() {
            position += ELEMENTS_PER_PAGE;
            $scope.infiniteScrollDisabled = false;
          });
      });
    };

    headerService.subHeader.setInjection('list-emails-subheader', $scope);

    mailboxesService
      .assignMailbox($stateParams.mailbox, $scope)
      .then(function() {
        $scope.groupedThreads = groups.getGroupedElements();
      });
  })

  .controller('composerController', function($scope, $stateParams, $q, headerService, notificationFactory,
                                            Composition, jmap, withJmapClient, fileUploadService, $filter,
                                            attachmentUploadService, _,
                                            DEFAULT_FILE_TYPE, DEFAULT_MAX_SIZE_UPLOAD) {

    this.initCtrl = function(email) {
      this.initCtrlWithComposition(new Composition(email));
    };

    this.initCtrlWithComposition = function(comp) {
      $scope.composition = comp;
      $scope.email = $scope.composition.getEmail();
    };

    this.saveDraft = function() {
      return $scope.composition.saveDraft();
    };

    this.showMobileHeader = function() {
      headerService.subHeader.setInjection('composer-subheader', $scope);
    };

    this.hideMobileHeader = function() {
      headerService.subHeader.resetInjections();
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

        uploadTask.defer.promise.then(function(task) {
          attachment.status = 'uploaded';
          attachment.error = null;
          attachment.blobId = task.response.blobId;
        }, function(err) {
          attachment.status = 'error';
          attachment.error = err;
        }, function(uploadTask) {
          attachment.upload.progress = uploadTask.progress;
        }).then($scope.composition.saveDraftSilently.bind($scope.composition));

        return attachment;
      };

      return attachment;
    }

    this.onAttachmentsSelect = function($files) {
      if (!$files || $files.length === 0) {
        return;
      }

      $scope.email.attachments = $scope.email.attachments || [];

      withJmapClient(function(client, config) {
        var maxSizeUpload = config.maxSizeUpload || DEFAULT_MAX_SIZE_UPLOAD,
            humanReadableMaxSizeUpload = $filter('bytes')(maxSizeUpload);

        $files.forEach(function(file) {
          if (file.size > maxSizeUpload) {
            return notificationFactory.weakError('', 'File ' + file.name + ' ignored as its size exceeds the ' + humanReadableMaxSizeUpload + ' limit');
          }

          $scope.email.attachments.push(newAttachment(client, file).startUpload());
        });
      });
    };

    this.removeAttachment = function(attachment) {
      attachment.upload && attachment.upload.cancel();
      _.pull($scope.email.attachments, attachment);

      $scope.composition.saveDraftSilently();
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
      $scope.disableSendButton();

      if ($scope.composition.canBeSentOrNotify()) {
        $scope.hide();
        $scope.composition.send();
      } else {
        $scope.enableSendButton();
      }
    };

  })

  .controller('viewEmailController', function($scope, $stateParams, $state, withJmapClient, jmap, Email, session, asyncAction, emailSendingService, newComposerService, headerService, inboxEmailService, JMAP_GET_MESSAGES_VIEW) {

    headerService.subHeader.setInjection('view-email-subheader', $scope);

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
  })

  .controller('viewThreadController', function($scope, $stateParams, headerService, withJmapClient, Email, Thread, inboxEmailService, inboxThreadService, _, JMAP_GET_MESSAGES_VIEW) {

    headerService.subHeader.setInjection('view-thread-subheader', $scope);

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
          var threadIsUnread = $scope.thread.isUnread;

          $scope.thread.emails.forEach(function(email, index, emails) {
            email.isCollapsed = !email.isUnread && (threadIsUnread || index < emails.length - 1);
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

  .controller('configurationController', function($scope, headerService, mailboxesService) {
    mailboxesService.assignMailboxesList($scope, mailboxesService.filterSystemMailboxes);
    headerService.subHeader.setInjection('configuration-index-subheader', $scope);
  })

  .controller('addFolderController', function($scope, $state, headerService, mailboxesService, notificationFactory, asyncJmapAction) {
    mailboxesService.assignMailboxesList($scope);
    headerService.subHeader.setInjection('add-folder-subheader', $scope);

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

  .controller('editFolderController', function($scope, $state, $stateParams, $modal, headerService, mailboxesService, _, notificationFactory, asyncJmapAction) {
    mailboxesService
      .assignMailboxesList($scope)
      .then(function(mailboxes) {
        $scope.mailbox = _.find(mailboxes, { id: $stateParams.mailbox });
      });

    headerService.subHeader.setInjection('edit-folder-subheader', $scope);

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

  .controller('recipientsFullscreenEditFormController', function($scope, $rootScope, $state, $stateParams, headerService) {
    if (!$stateParams.rcpt || !$stateParams.composition) {
      $state.go('unifiedinbox.compose');
    }

    $scope.rcpt = $stateParams.rcpt;
    $scope.composition = $stateParams.composition;

    headerService.subHeader.setInjection('fullscreen-edit-form-subheader', $scope);
    headerService.subHeader.setVisibleMD();
  })

  .controller('attachmentController', function($window) {
    this.download = function(attachment) {
      $window.open(attachment.url);
    };
  });
