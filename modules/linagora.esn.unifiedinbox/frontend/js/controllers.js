'use strict';

angular.module('linagora.esn.unifiedinbox')
  .controller('listEmailsController', function($scope, $route, jmapClient, EmailGroupingTool) {
    $scope.mailbox = $route.current.params.mailbox;

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
  .controller('viewEmailController', function($scope, $route, $location, jmapClient, MAILBOX_ROLES) {
    $scope.mailbox = $route.current.params.mailbox;
    $scope.emailId = $route.current.params.emailId;

    $scope.moveToTrash = function() {
      $location.path('/unifiedinbox/' + $scope.mailbox);
    };

    jmapClient.getMessages({
      ids: [$scope.emailId]
    }).then(function(messages) {
      $scope.email = messages[0]; // We expect a single message here
    });
  });
