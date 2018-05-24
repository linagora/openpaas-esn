'use strict';

describe('The esnCollaborationInvitationAcceptButton directive', function() {
  var scope, $rootScope, $compile;
  var esnCollaborationClientService, notification, html;

  beforeEach(function() {
    var esnCollaborationClientService = {
      join: function() {}
    };

    var objectTypeResolver = {
      resolve: function() {},
      register: function() {}
    };

    module('esn.user-notification', 'esn.object-type', 'esn.collaboration', 'esn.collaboration', 'jadeTemplates');
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

    html = '<esn-collaboration-membership-invitation-user-notification notification="notification"><esn-collaboration-invitation-accept-button/></esn-collaboration-membership-invitation-user-notification>';
  }));

  it('should call esnCollaborationClientService#join', function(done) {
    esnCollaborationClientService.join = function() {
      return done();
    };
    var element = $compile(html)(scope);

    scope.$digest();
    element.find('esn-collaboration-invitation-accept-button').scope().accept();
  });

  it('should call notification#setAcknowledged(true)', function(done) {
    esnCollaborationClientService.join = function() {
      return $q.when({ data: { _id: 123 } });
    };
    notification.setAcknowledged = function() {
      return done();
    };

    var element = $compile(html)(scope);

    scope.$digest();
    element.find('esn-collaboration-invitation-accept-button').scope().accept();
    scope.$digest();
  });
});
