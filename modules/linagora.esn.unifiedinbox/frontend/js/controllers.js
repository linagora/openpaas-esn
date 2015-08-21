'use strict';

angular.module('linagora.esn.unifiedinbox')
  .controller('listEmailsController', function($scope, $route, JmapAPI) {
    $scope.mailbox = $route.current.params.mailbox;
    $scope.groupedEmails = JmapAPI.getEmails($scope.mailbox);
  })
  .controller('viewEmailController', function($scope, $route, JmapAPI) {
    $scope.mailbox = $route.current.params.mailbox;
    $scope.emailId = $route.current.params.emailId;
    $scope.email = JmapAPI.getEmail($scope.emailId);
  });
