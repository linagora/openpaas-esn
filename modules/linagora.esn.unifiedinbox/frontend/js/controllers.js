'use strict';

angular.module('linagora.esn.unifiedinbox')

  .controller('homeController', function(headerService) {
    headerService.subHeader.resetInjections();
  })

  .controller('listEmailsController', function($scope, $stateParams, $location, jmap, withJmapClient, EmailGroupingTool, newComposerService, headerService) {

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
            properties: ['id', 'threadId', 'subject', 'from', 'to', 'preview', 'date', 'isUnread', 'hasAttachment', 'mailboxIds']
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

    $scope.openEmail = function(email) {
      if (isDraftMailbox()) {
        newComposerService.openDraft(email);
      } else {
        $location.path('/unifiedinbox/' + $scope.mailbox + '/' + email.id);
      }
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

  .controller('composerController', function($scope, Composition, attendeeService, INBOX_AUTOCOMPLETE_LIMIT) {

    var self = this;

    this.search = function(query) {
      return attendeeService.getAttendeeCandidates(query, INBOX_AUTOCOMPLETE_LIMIT).then(function(recipients) {
        return recipients.filter(function(recipient) {
          return recipient.email;
        });
      });
    };

    this.initCtrl = function(email) {
      self.composition = new Composition(email);
      $scope.email = self.composition.getEmail();
    };

    this.saveDraft = function() {
      self.composition.saveDraft();
    };

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

      if (self.composition.canBeSentOrNotify()) {
        $scope.hide();
        self.composition.send();
      } else {
        $scope.enableSendButton();
      }
    };

  })

  .controller('viewEmailController', function($scope, $stateParams, $location, withJmapClient, jmap, session, notificationFactory, emailSendingService, newComposerService, headerService) {

    headerService.subHeader.setInjection('view-email-subheader', $scope);

    $scope.mailbox = $stateParams.mailbox;
    $scope.emailId = $stateParams.emailId;

    $scope.moveToTrash = function() {
      $scope.email.moveToMailboxWithRole(jmap.MailboxRole.TRASH)
        .then(function() {
          notificationFactory.weakSuccess('Successfully moved message to trash', '');
          $location.path('/unifiedinbox/' + $scope.mailbox);
        }, function(err) {
          notificationFactory.weakError('Failed to move message to trash', err.message || err);
        });
    };

    $scope.reply = function() {
      emailSendingService.createReplyEmailObject($scope.email, session.user).then(newComposerService.openEmailCustomTitle.bind(null, 'Start writing your reply email'));
    };

    $scope.replyAll = function() {
      emailSendingService.createReplyAllEmailObject($scope.email, session.user).then(newComposerService.openEmailCustomTitle.bind(null, 'Start writing your reply all email'));
    };

    $scope.forward = function() {
      emailSendingService.createForwardEmailObject($scope.email, session.user).then(newComposerService.openEmailCustomTitle.bind(null, 'Start writing your forward email'));
    };

    withJmapClient(function(client) {
      client.getMessages({
        ids: [$scope.emailId]
      }).then(function(messages) {
        $scope.email = messages[0]; // We expect a single message here
      });
    });
  })

  .controller('configurationController', function($scope, headerService, mailboxesService) {
    mailboxesService.assignMailboxesList($scope, mailboxesService.filterSystemMailboxes);
    headerService.subHeader.setInjection('configuration-index-subheader', $scope);
  })

  .controller('addFolderController', function($scope, $state, headerService, mailboxesService, notificationFactory) {
    mailboxesService.assignMailboxesList($scope);
    headerService.subHeader.setInjection('add-folder-subheader', $scope);

    $scope.mailbox = {};

    $scope.addFolder = function() {
      notificationFactory.weakSuccess('Successfully created folder ' + $scope.mailbox.name + ' as a child of ' + $scope.mailbox.parentId, '');
      $state.go('/unifiedinbox/configuration');
    };
  })

  .controller('editFolderController', function($scope, $state, $stateParams, $modal, headerService, mailboxesService, _, notificationFactory, withJmapClient) {
    mailboxesService
      .assignMailboxesList($scope)
      .then(function(mailboxes) {
        $scope.mailbox = _.find(mailboxes, { id: $stateParams.mailbox });
      });

    headerService.subHeader.setInjection('edit-folder-subheader', $scope);

    $scope.editFolder = function() {
      notificationFactory.weakSuccess('Successfully edited folder ' + $scope.mailbox.name + ' as a child of ' + $scope.mailbox.parentId, '');
      $state.go('/unifiedinbox/configuration');
    };

    $scope.confirmationDialog = function() {
      $scope.modal = $modal({scope: $scope, templateUrl: '/unifiedinbox/views/configuration/folders/delete/index', backdrop: 'static', placement: 'center'});
    };

    $scope.deleteFolder = function() {
      notificationFactory.weakInfo('Deleting ' + $scope.mailbox.name);
      withJmapClient(function(client) {
        client
          .destroyMailbox($scope.mailbox.id)
          .then(function() {
            notificationFactory.weakSuccess('Successfully deleted folder ' + $scope.mailbox.name);
          }, function() {
            notificationFactory.weakError('Error while deleting folder ' + $scope.mailbox.name);
          });
      });
    };
  });
