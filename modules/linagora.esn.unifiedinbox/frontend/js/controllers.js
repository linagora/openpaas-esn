'use strict';

angular.module('linagora.esn.unifiedinbox')
  .controller('listEmailsController', function($scope, $stateParams, jmapClient, EmailGroupingTool) {
    $scope.mailbox = $stateParams.mailbox;

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
  })

  .controller('composerController', function($scope, $q, $timeout, session, notificationFactory, emailSendingService, Offline, attendeeService, INBOX_AUTOCOMPLETE_LIMIT, draftService) {

    function getToolbarConfiguration() {
      var toolbarConfiguration = [
        ['style', ['bold', 'italic', 'underline', 'strikethrough']],
        ['textsize', ['fontsize']],
        ['alignment', ['paragraph', 'ul', 'ol']],
        ['fullscreen', ['fullscreen']]
      ];
      return toolbarConfiguration;
    }

    $scope.isCollapsed = true;
    $scope.summernoteOptions = {
      focus: true,
      airMode: false,
      toolbar: getToolbarConfiguration()
    };

    var draft = draftService.startDraft($scope.email);
    $scope.saveDraft = function() {
      draft.save($scope.email);
    };

    this.search = function(query) {
      return attendeeService.getAttendeeCandidates(query, INBOX_AUTOCOMPLETE_LIMIT).then(function(recipients) {
        return recipients.filter(function(recipient) {
          return recipient.email;
        });
      });
    };

    function validateEmailSending(rcpt) {
      if (emailSendingService.noRecipient(rcpt)) {
        notificationFactory.weakError('Note', 'Your email should have at least one recipient');
        return false;
      }

      if (!Offline.state || Offline.state === 'down') {
        notificationFactory.weakError('Note', 'Your device loses its Internet connection. Try later!');
        return false;
      }

      emailSendingService.removeDuplicateRecipients(rcpt);

      return true;
    }

    $scope.send = function() {
      $scope.disableSendButton();
      if (validateEmailSending($scope.email.rcpt)) {

        $scope.hide();
        $scope.email.from = session.user;

        var notify = notificationFactory.notify('info', 'Info', 'Sending', { from: 'bottom', align: 'right'}, 0);
        emailSendingService.sendEmail($scope.email).then(
          function() {
            notify.close();
            notificationFactory.weakSuccess('Success', 'Your email has been sent');
          },
          function() {
            notify.close();
            notificationFactory.weakError('Error', 'An error has occurred while sending email');
          }
        );
      } else {
        $scope.enableSendButton();
      }
    };

    // for test purposes: the send function which is supposed to be called to send messages via JMAP client
    if (!$scope.sendViaJMAP) {
      $scope.sendViaJMAP = function() {
        var defer = $q.defer();
        $timeout(function() {
          return defer.resolve();
        }, 3000);
        return defer.promise;
      };
    }
  })

  .controller('viewEmailController', function($scope, $stateParams, $location, jmapClient, jmap, notificationFactory) {
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

    jmapClient.getMessages({
      ids: [$scope.emailId]
    }).then(function(messages) {
      $scope.email = messages[0]; // We expect a single message here
    });
  });
