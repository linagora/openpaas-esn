'use strict';

angular.module('linagora.esn.unifiedinbox')
  .controller('listEmailsController', function($scope, $route, JmapAPI) {
    $scope.mailbox = $route.current.params.mailbox;
    $scope.groupedEmails = JmapAPI.getEmails($scope.mailbox);
  })
  .controller('viewEmailController', function($scope, $route, $location, JmapAPI, MAILBOX_ROLES) {
    $scope.mailbox = $route.current.params.mailbox;
    $scope.emailId = $route.current.params.emailId;
    $scope.email = JmapAPI.getEmail($scope.emailId);

    $scope.moveToTrash = function() {
      JmapAPI.moveToByRole($scope.emailId, MAILBOX_ROLES.trash);
      $location.path('/unifiedinbox/' + $scope.mailbox);
    };
  });
