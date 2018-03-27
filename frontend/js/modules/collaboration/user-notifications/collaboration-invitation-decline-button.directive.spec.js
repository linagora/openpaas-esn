'use strict';

describe('The esnCollaborationInvitationDeclineButton directive', function() {
  beforeEach(function() {
    angular.mock.module('esn.collaboration');
  });

  beforeEach(function() {
    var esnCollaborationClientService = {
      cancelRequestMembership: function() {
      }
    };

    var esnUserNotificationService = {
      setAcknowledged: function() {
      }
    };

    var objectTypeResolver = {
      resolve: function() {},
      register: function() {}
    };

    angular.mock.module('esn.collaboration');
    angular.mock.module('esn.user-notification');
    angular.mock.module('esn.object-type');
    angular.mock.module(function($provide) {
      $provide.value('esnCollaborationClientService', esnCollaborationClientService);
      $provide.value('esnUserNotificationService', esnUserNotificationService);
      $provide.value('objectTypeResolver', objectTypeResolver);
    });
    module('jadeTemplates');
  });

  beforeEach(angular.mock.inject(function($rootScope, $compile, esnCollaborationClientService, esnUserNotificationService, esnCollaborationMembershipInvitationUserNotificationDirective) {
    this.$rootScope = $rootScope;
    this.$compile = $compile;
    this.scope = $rootScope.$new();
    this.esnCollaborationClientService = esnCollaborationClientService;
    this.esnUserNotificationService = esnUserNotificationService;
    esnCollaborationMembershipInvitationUserNotificationDirective[0].controller = function($scope) {
      this.actionDone = function() {};
      $scope.invitedUser = {
        _id: '123'
      };
      $scope.invitationCollaboration = {
        _id: '456'
      };
      $scope.notification = {
        _id: '789'
      };
    };

    this.html = '<esn-collaboration-membership-invitation-user-notification notification="notification"><esn-collaboration-invitation-decline-button/></esn-collaboration-membership-invitation-user-notification>';
  }));

  it('should call esnCollaborationClientService#cancelRequestMemberShip', function(done) {
    this.esnCollaborationClientService.cancelRequestMembership = function() {
      return done();
    };
    var element = this.$compile(this.html)(this.scope);

    this.scope.$digest();
    element.find('esn-collaboration-invitation-decline-button').scope().decline();
  });

  it('should call esnUserNotificationService#setAcknowledged(true)', function(done) {
    this.esnCollaborationClientService.cancelRequestMembership = function() {
      return $q.when();
    };
    this.esnUserNotificationService.setAcknowledged = function() {
      return done();
    };

    var element = this.$compile(this.html)(this.scope);

    this.scope.$digest();
    element.find('esn-collaboration-invitation-decline-button').scope().decline();
    this.scope.$digest();
  });
});
