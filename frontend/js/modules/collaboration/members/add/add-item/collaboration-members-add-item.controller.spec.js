'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The ESNCollaborationMembersAddItemController controller', function() {

  var $q, $controller, scope, member, collaboration, objectType, $rootScope, esnCollaborationClientService;

  beforeEach(function() {

    member = {};

    objectType = 'chat.conversation';

    collaboration = {
      _id: 'ID'
    };

    esnCollaborationClientService = {
      requestMembership: sinon.spy(function() {
        return $q.when();
      })
    };

    angular.mock.module('esn.collaboration', function($provide) {
      $provide.value('esnCollaborationClientService', esnCollaborationClientService);
      $provide.value('notificationFactory', {
        weakSuccess: sinon.spy(),
        weakError: sinon.spy()
      });
    });

    angular.mock.inject(function(_$q_, _$rootScope_, _$controller_) {
      $rootScope = _$rootScope_;
      scope = _$rootScope_.$new();
      $controller = _$controller_;
      $q = _$q_;
    });
  });

  function initController(options) {
    var controller = $controller('ESNCollaborationMembersAddItemController as ctrl', {$scope: scope}, options);

    scope.$digest();

    return controller;
  }

  describe('the inviteMember function', function() {
    it('should call esnCollaborationClientService.requestMembership', function() {
      var controller = initController({collaboration: collaboration, objectType: objectType, member: member});

      controller.inviteMember();

      $rootScope.$digest();

      expect(esnCollaborationClientService.requestMembership).to.have.been.calledOnce;
    });
  });
});
