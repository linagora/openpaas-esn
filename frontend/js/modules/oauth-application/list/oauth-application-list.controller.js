(function() {
  'use strict';

  angular.module('esn.oauth-application')
    .controller('ESNOauthApplicationListController', ESNOAuthApplicationListController);

  function ESNOAuthApplicationListController($log, $modal, $scope, ESNOauthApplicationClient) {
    var self = this;

    self.$onInit = $onInit;
    self.openModal = openModal;

    function openModal() {
      $modal({
        templateUrl: '/views/modules/oauth-application/form/add/oauth-application-add-form-modal.html',
        placement: 'center',
        controller: function($scope) {
          $scope.onCreated = function(application) {
            if (application) {
              self.applications.unshift(application);
            }
            $scope.$hide();
          };
        }
      });
    }

    function $onInit() {
      ESNOauthApplicationClient.created().then(function(result) {
        self.applications = result.data;
      }, function(err) {
        $log.error('Can not get user applications', err);
      });
    }
  }
})();
