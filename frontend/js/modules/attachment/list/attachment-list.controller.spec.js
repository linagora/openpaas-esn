'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The ESNAttachmentListController controller', function() {
  var $controller, $scope, $q, esnAttachmentListProviders, $rootScope;
  var objectType = 'chat.conversation';
  var id = '123456789';

  function initController(objectType, id) {
    var controller = $controller('ESNAttachmentListController',
      {$scope: $scope},
      {objectType: objectType, id: id}
    );

    $scope.$digest();

    return controller;
  }

  beforeEach(function() {
    esnAttachmentListProviders = {
      getAll: sinon.spy(function() {
        return $q.when();
      })
    };

    angular.mock.module('esn.attachment-list', function($provide) {
      $provide.constant('esnAttachmentListProviders', esnAttachmentListProviders);
    });
  });

  beforeEach(inject(function(_$controller_, _$q_, _$rootScope_) {
    $controller = _$controller_;
    $rootScope = _$rootScope_;
    $q = _$q_;
    $scope = $rootScope.$new();
  }));

  describe('The loadMoreElements function', function() {

    it('should call esnAttachmentListProviders with the correct arguments when loadMoreElements is called', function() {
      var ctrl = initController(objectType, id);

      ctrl.loadMoreElements();

      expect(esnAttachmentListProviders.getAll).to.have.been.calledWith({objectType: objectType, id: id, acceptedTypes: [objectType]});
    });
  });
});
