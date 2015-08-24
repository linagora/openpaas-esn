'use strict';

angular.module('linagora.esn.unifiedinbox')
  .controller('listEmailsController', function($scope, $route, JmapAPI) {
    $scope.mailbox = $route.current.params.mailbox;
    $scope.groupedEmails = JmapAPI.getEmails($scope.mailbox);
  });
