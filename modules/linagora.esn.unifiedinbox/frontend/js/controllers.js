'use strict';

angular.module('linagora.esn.unifiedinbox')

  .controller('goToInboxController', function($state, withJmapClient, jmap) {
    withJmapClient(function(client) {
      client.getMailboxWithRole(jmap.MailboxRole.INBOX).then(function(mailbox) {
        $state.go('unifiedinbox.mailbox', { mailbox: mailbox.id });
      });
    });
  })

  .controller('listEmailsController', function($scope, $stateParams, $state, jmap, withJmapClient, EmailGroupingTool, newComposerService, headerService, jmapEmailService) {

    function searchForMessages() {
      withJmapClient(function(client) {
        client.getMessageList({
          filter: {
            inMailboxes: [$scope.mailbox]
          },
          collapseThreads: true,
          fetchMessages: false,
          position: 0,
          limit: 100
        }).then(function(messageList) {
          return messageList.getMessages({
            properties: ['id', 'threadId', 'subject', 'from', 'to', 'preview', 'date', 'isUnread', 'isFlagged', 'hasAttachment', 'mailboxIds']
          });
        }).then(function(messages) {
          $scope.groupedEmails = new EmailGroupingTool($scope.mailbox, messages).getGroupedEmails();
        });
      });
    }

    function isDraftMailbox() {
      return $scope.mailboxRole === jmap.MailboxRole.DRAFTS;
    }

    headerService.subHeader.setInjection('list-emails-subheader', $scope);

    $scope.mailbox = $stateParams.mailbox;

    this.openEmail = function(email) {
      if (isDraftMailbox()) {
        newComposerService.openDraft(email);
      } else {
        $state.go('unifiedinbox.email', {
          mailbox: $scope.mailbox,
          emailId: email.id
        });
      }
    };

    this.setIsFlagged = function(event, email, state) {
      event.stopImmediatePropagation();
      event.preventDefault();

      jmapEmailService.setFlag(email, 'isFlagged', state);
    };

    withJmapClient(function(client) {
      client.getMailboxes({
        ids: [$scope.mailbox],
        properties: ['name', 'role']
      }).then(function(mailboxes) {
        $scope.mailboxRole = mailboxes[0].role; // We expect a single mailbox here
        $scope.mailboxName = mailboxes[0].name;
      }).then(searchForMessages);
    });

  })

  .controller('composerController', function($scope, $stateParams, headerService, Composition) {

    this.initCtrl = function(email) {
      this.initCtrlWithComposition(new Composition(email));
    };

    this.initCtrlWithComposition = function(comp) {
      $scope.composition = comp;
      $scope.email = $scope.composition.getEmail();
    };

    this.saveDraft = function() {
      $scope.composition.saveDraft();
    };

    this.showMobileHeader = function() {
      headerService.subHeader.setInjection('composer-subheader', $scope);
    };

    this.hideMobileHeader = function() {
      headerService.subHeader.resetInjections();
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
        ['alignment', ['paragraph', 'ul', 'ol']],
        ['fullscreen', ['esnFullscreen']]
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

  .controller('viewEmailController', function($scope, $stateParams, $state, withJmapClient, jmap, session, asyncAction, emailSendingService, newComposerService, headerService, jmapEmailService) {

    headerService.subHeader.setInjection('view-email-subheader', $scope);

    $scope.mailbox = $stateParams.mailbox;
    $scope.emailId = $stateParams.emailId;

    this.moveToTrash = function() {
      asyncAction('Move of message "' + $scope.email.subject + '" to trash', function() {
        return $scope.email.moveToMailboxWithRole(jmap.MailboxRole.TRASH);
      }).then(function() {
        $state.go('unifiedinbox.mailbox', { mailbox: $scope.mailbox });
      });
    };

    this.reply = function() {
      emailSendingService.createReplyEmailObject($scope.email, session.user).then(newComposerService.openEmailCustomTitle.bind(null, 'Start writing your reply email'));
    };

    this.replyAll = function() {
      emailSendingService.createReplyAllEmailObject($scope.email, session.user).then(newComposerService.openEmailCustomTitle.bind(null, 'Start writing your reply all email'));
    };

    this.forward = function() {
      emailSendingService.createForwardEmailObject($scope.email, session.user).then(newComposerService.openEmailCustomTitle.bind(null, 'Start writing your forward email'));
    };

    this.markAsUnread = function() {
      jmapEmailService.setFlag($scope.email, 'isUnread', true);
    };

    this.markAsRead = function() {
      jmapEmailService.setFlag($scope.email, 'isUnread', false);
    };

    this.markAsFlagged = function() {
      this.setIsFlagged(null, $scope.email, true);
    };

    this.unmarkAsFlagged = function() {
      this.setIsFlagged(null, $scope.email, false);
    };

    this.setIsFlagged = function(event, email, state) {
      jmapEmailService.setFlag(email, 'isFlagged', state);
    };

    withJmapClient(function(client) {
      client.getMessages({
        ids: [$scope.emailId]
      }).then(function(messages) {
        $scope.email = messages[0]; // We expect a single message here

        jmapEmailService.setFlag($scope.email, 'isUnread', false);
      });
    });
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
  });
