(function(angular) {
  'use strict';

  angular.module('esn.community')
    .factory('communityDeleteConfirmationModalService', communityDeleteConfirmationModalService);

  function communityDeleteConfirmationModalService($modal) {
    return function(community, onConfirm) {
      return $modal({
        templateUrl: '/views/modules/community/remove/community-remove-modal.html',
        controller: function() {
          this.community = community;
          this.delete = onConfirm;
        },
        controllerAs: 'ctrl',
        backdrop: 'static',
        placement: 'center'
      });
    };
  }
})(angular);
