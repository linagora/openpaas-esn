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

  .controller('composerController', function($scope, Composition, attendeeService, INBOX_AUTOCOMPLETE_LIMIT) {

    var composition = new Composition($scope.email);

    this.search = function(query) {
      return attendeeService.getAttendeeCandidates(query, INBOX_AUTOCOMPLETE_LIMIT).then(function(recipients) {
        return recipients.filter(function(recipient) {
          return recipient.email;
        });
      });
    };

    this.saveDraft = composition.saveDraft;

    $scope.isCollapsed = true;
    $scope.summernoteOptions = {
      focus: true,
      airMode: false,
      toolbar: [
        ['style', ['bold', 'italic', 'underline', 'strikethrough']],
        ['textsize', ['fontsize']],
        ['alignment', ['paragraph', 'ul', 'ol']],
        ['fullscreen', ['fullscreen']]
      ]
    };

    $scope.send = function() {

      $scope.disableSendButton();

      if (composition.canBeSentOrNotify()) {
        $scope.hide();
        composition.send();
      } else {
        $scope.enableSendButton();
      }
    };

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
