'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The ESNCollaborationMembersAddController controller', function() {

  var $q, $controller, expectedPeople, esnPaginationtionProviderBuilder, scope, collaboration, objectType, loadMoreElements, $rootScope, esnCollaborationMembersAddService, options;

  beforeEach(function() {

    collaboration = {
      _id: 'ID'
    };

    options = {
      limit: 20,
      offset: 0
    };

    objectType = 'chat.conversation';

    expectedPeople = [
      {
        _id: 'foo'
      },
      {
      _id: 'bar'
      }
    ];

    loadMoreElements = function() {};

    esnPaginationtionProviderBuilder = sinon.spy();

    esnCollaborationMembersAddService = {
      getInvitablePeople: sinon.spy(function() {
        return $q.when(expectedPeople);
      })
    };

    angular.mock.module('esn.collaboration', function($provide) {
      $provide.value('esnPaginationtionProviderBuilder', esnPaginationtionProviderBuilder);
      $provide.value('esnCollaborationMembersAddService', esnCollaborationMembersAddService);
    });

    angular.mock.inject(function(_$q_, _$rootScope_, _$controller_) {
      $rootScope = _$rootScope_;
      scope = _$rootScope_.$new();
      $controller = _$controller_;
      $q = _$q_;
    });
  });

  function initController(options) {
    var controller = $controller('ESNCollaborationMembersAddController as ctrl', {$scope: scope}, options);

    scope.$digest();

    return controller;
  }

  describe('the $onInit function', function() {
    it('should call esnPaginationtionProviderBuilder', function() {
      var controller = initController({
        collaboration: collaboration,
        objectType: objectType,
        loadMoreElements: loadMoreElements,
        options: options
      });
      controller.$onInit();
      $rootScope.$digest();

      expect(esnPaginationtionProviderBuilder).to.have.been.calledOnce;
    });
  });

  describe('the onChange function', function() {
    it('should call esnPaginationtionProviderBuilder service when the query is not empty', function() {
      var controller = initController({collaboration: collaboration, objectType: objectType, loadMoreElements: loadMoreElements, options: options});

      controller.query = ' ';
      controller.onChange();

      $rootScope.$digest();

      expect(esnPaginationtionProviderBuilder).to.have.been.calledOnce;
    });
  });
});
