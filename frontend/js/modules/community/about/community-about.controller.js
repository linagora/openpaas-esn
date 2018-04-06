(function(angular) {
  'use strict';

  angular.module('esn.community').controller('communityAboutController', communityAboutController);

  function communityAboutController(communityService, communityAPI, session) {
    var self = this;

    self.cancelEdition = cancelEdition;
    self.canEditDescription = canEditDescription;
    self.editDescription = editDescription;
    self.updateDescription = updateDescription;
    self.$onInit = $onInit;

    function $onInit() {
      self.edit = false;
    }

    function cancelEdition() {
      self.edit = false;
    }

    function canEditDescription() {
      return communityService.isManager(self.community, session.user);
    }

    function editDescription() {
      self.edit = true;
      self.description = angular.copy(self.community.description);
    }

    function updateDescription() {
      communityAPI.update(self.community._id, { description: self.description })
        .then(function() {
          self.community.description = self.description;
        }).finally(function() {
          self.edit = false;
        });
    }
  }

})(angular);
