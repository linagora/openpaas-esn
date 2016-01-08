'use strict';

angular.module('linagora.esn.unifiedinbox')
  .controller('listEmailsController', function($scope, $stateParams, $location, jmap, jmapClient, EmailGroupingTool, newComposerService) {

    function searchForMessages() {
      jmapClient.getMessageList({
        filter: {
          inMailboxes: [$scope.mailbox]
        },
        collapseThreads: true,
        fetchMessages: true,
        position: 0,
        limit: 100
      }).then(function(data) {
        $scope.groupedEmails = new EmailGroupingTool($scope.mailbox, data[1]).getGroupedEmails(); // data[1] is the array of Messages
      });
    }

    function isDraftMailbox() {
      return $scope.mailboxRole === jmap.MailboxRole.DRAFTS;
    }

    $scope.mailbox = $stateParams.mailbox;

    $scope.openEmail = function(email) {
      if (isDraftMailbox()) {
        newComposerService.openDraft(email);
      } else {
        $location.path('/unifiedinbox/' + $scope.mailbox + '/' + email.id);
      }
    };

    jmapClient.getMailboxes({
      ids: [$scope.mailbox],
      properties: ['name', 'role']
    }).then(function(mailboxes) {
      $scope.mailboxRole = mailboxes[0].role; // We expect a single mailbox here
      $scope.mailboxName = mailboxes[0].name;
    }).then(searchForMessages);

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
      focus: true,
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

  .controller('viewEmailController', function($scope, $stateParams, $location, jmapClient, jmap, session, notificationFactory, emailSendingService, newComposerService) {
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
      newComposerService.openEmailCustomTitle('Start writing your reply email', emailSendingService.createReplyEmailObject($scope.email, session.user));
    };

    $scope.replyAll = function() {
      newComposerService.openEmailCustomTitle('Start writing your reply all email', emailSendingService.createReplyAllEmailObject($scope.email, session.user));
    };

    jmapClient.getMessages({
      ids: [$scope.emailId]
    }).then(function(messages) {
      $scope.email = messages[0]; // We expect a single message here
    });
  });
