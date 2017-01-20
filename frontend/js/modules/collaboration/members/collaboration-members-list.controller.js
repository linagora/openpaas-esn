(function() {
  'use strict';

  angular.module('esn.collaboration')
    .controller('ESNCollaborationMembersListController', ESNCollaborationMembersListController);

  function ESNCollaborationMembersListController(esnCollaborationClientService, usSpinnerService) {
    var self = this;

    self.$onInit = $onInit;
    self.loadMoreElements = loadMoreElements;
    self.members = [];
    self.offset = 0;
    self.spinnerKey = 'membersSpinner';
    self.total = 0;
    self.restActive = false;
    self.error = false;

    var opts = {
      offset: 0,
      limit: 20,
      objectTypeFilter: self.objectTypeFilter
    };

    function $onInit() {
      updateMembersList();
    }

    function loadMoreElements() {
      if (self.offset === 0 || self.offset < self.total) {
        opts.offset = self.offset;
        updateMembersList();
      }
    }

    function updateMembersList() {
      self.error = false;
      if (self.restActive) {
        return;
      }

      self.restActive = true;
      usSpinnerService.spin(self.spinnerKey);

      esnCollaborationClientService.getMembers(self.collaborationType, self.collaboration._id, opts).then(function(result) {
        self.total = parseInt(result.headers('X-ESN-Items-Count'), 10);

        // Loop over member just for adding the `members_count` field required by the community and project template
        var members = result.data.map(function(member) {
          var memberData = member[member.objectType];

          if (memberData && Array.isArray(memberData.members)) {
            member[member.objectType].members_count = memberData.members.length;
          }

          return member;
        });

        self.members = self.members.concat(members);
        self.offset += result.data.length;
        self.memberCount = result.data.length;
      }, function() {
        self.error = true;
      }).finally(function() {
        self.restActive = false;
        usSpinnerService.stop(self.spinnerKey);
      });
    }
  }
})();
