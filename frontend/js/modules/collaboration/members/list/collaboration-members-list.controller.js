(function() {
  'use strict';

  angular.module('esn.collaboration')
    .controller('ESNCollaborationMembersListController', ESNCollaborationMembersListController);

  function ESNCollaborationMembersListController(
    _,
    $scope,
    $q,
    $rootScope,
    esnCollaborationClientService,
    esnCollaborationMemberPaginationProvider,
    infiniteScrollHelper,
    PageAggregatorService,
    ESN_COLLABORATION_MEMBER_EVENTS,
    ESN_COLLABORATION_MEMBERSHIP_EVENTS,
    ELEMENTS_PER_PAGE
  ) {
    var self = this;
    var aggregator;
    var results_per_page = self.elementsPerPage || ELEMENTS_PER_PAGE;
    var options = {
      offset: 0,
      limit: results_per_page,
      objectTypeFilter: self.objectTypeFilter
    };

    self.$onInit = $onInit;
    self.$onDestroy = $onDestroy;
    self.updateMembers = updateMembers;

    function $onInit() {
      self.collaborationJoinRemover = $rootScope.$on(ESN_COLLABORATION_MEMBERSHIP_EVENTS.JOIN, updateMembers);
      self.collaborationLeaveRemover = $rootScope.$on(ESN_COLLABORATION_MEMBERSHIP_EVENTS.LEAVE, updateMembers);
      self.collaborationRequestAccepted = $rootScope.$on(ESN_COLLABORATION_MEMBER_EVENTS.ACCEPTED, updateMembers);
      self.collaborationMemberRemoved = $scope.$on(ESN_COLLABORATION_MEMBER_EVENTS.REMOVED, onMemberRemoved);
    }

    function $onDestroy() {
      self.collaborationJoinRemover();
      self.collaborationLeaveRemover();
      self.collaborationMemberRemoved();
      self.collaborationRequestAccepted();
    }

    function onMemberRemoved(event, removed) {
      self.elements = self.elements.filter(function(member) {
        return member.id !== removed.id;
      });
    }

    self.loadMoreElements = infiniteScrollHelper(self, function() {
      if (aggregator) {
        return load();
      }

      var provider = new esnCollaborationMemberPaginationProvider({
        id: self.collaboration.id || self.collaboration._id,
        objectType: self.collaboration.objectType
      }, options);

      aggregator = new PageAggregatorService('CollaborationMembersAggregator', [provider], {
        compare: function(a, b) { return b.metadata.timestamps.creation - a.metadata.timestamps.creation; },
        results_per_page: results_per_page
      });

      return load();
    });

    function load() {
      return aggregator.loadNextItems().then(_.property('data'), _.constant([]));
    }

    function updateMembers() {
      esnCollaborationClientService.getMembers(self.collaboration.objectType, self.collaboration._id).then(function(result) {
        self.elements = result.data;
      }, function() {
        self.error = true;
      });
    }
  }

})();
