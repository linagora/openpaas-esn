'use strict';

angular.module('linagora.esn.unifiedinbox')
  .controller('listEmailsController', function($scope, $route, JmapAPI) {
    $scope.mailbox = $route.current.params.mailbox;
    JmapAPI.getEmails($scope.mailbox).then(function(result) {
      $scope.groupedEmails = result;
    });
  });
