'use strict';

describe('The esnCollaborationInvitationDeclineButton directive', function() {
  var scope, $rootScope, $compile;
  var esnCollaborationClientService, notification, html;

  beforeEach(function() {
    var esnCollaborationClientService = {
      cancelRequestMembership: function() {
      }
    };

    var objectTypeResolver = {
      resolve: function() {},
      register: function() {}
    };

    module('esn.collaboration', 'jadeTemplates', 'esn.object-type', 'esn.user-notification', 'esn.collaboration');
    module(function($provide) {
      $provide.value('esnCollaborationClientService', esnCollaborationClientService);
      $provide.value('objectTypeResolver', objectTypeResolver);
    });
  });

  beforeEach(inject(function(
    _$rootScope_,
    _$compile_,
    _esnCollaborationClientService_,
    esnCollaborationMembershipInvitationUserNotificationDirective
  ) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    scope = $rootScope.$new();
    esnCollaborationClientService = _esnCollaborationClientService_;
    notification = {
      _id: '789'
    };
    esnCollaborationMembershipInvitationUserNotificationDirective[0].controller = function($scope) {
      this.actionDone = function() {};
      $scope.invitedUser = {
        _id: '123'
      };
      $scope.invitationCollaboration = {
        _id: '456'
      };
      $scope.notification = notification;
    };

    html = '<esn-collaboration-membership-invitation-user-notification notification="notification"><esn-collaboration-invitation-decline-button/></esn-collaboration-membership-invitation-user-notification>';
  }));

  it('should call esnCollaborationClientService#cancelRequestMemberShip', function(done) {
    esnCollaborationClientService.cancelRequestMembership = function() {
      return done();
    };
    var element = $compile(html)(scope);

    scope.$digest();
    element.find('esn-collaboration-invitation-decline-button').scope().decline();
  });

  it('should call notification#setAcknowledged(true)', function(done) {
    esnCollaborationClientService.cancelRequestMembership = function() {
      return $q.when();
    };
    notification.setAcknowledged = function() {
      return done();
    };

    var element = $compile(html)(scope);

    scope.$digest();
    element.find('esn-collaboration-invitation-decline-button').scope().decline();
    scope.$digest();
  });
});
