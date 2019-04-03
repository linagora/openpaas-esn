'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The ESNSearchAdvancedFormController', function() {
  var $rootScope, $controller;
  var esnSearchQueryService;

  beforeEach(function() {
    module('esn.search');

    inject(function(
      _$rootScope_,
      _$controller_,
      _esnSearchQueryService_
    ) {
      $rootScope = _$rootScope_;
      $controller = _$controller_;
      esnSearchQueryService = _esnSearchQueryService_;
    });

    esnSearchQueryService.clearAdvancedQuery = sinon.stub();
  });

  function initController() {
    var $scope = $rootScope.$new();

    var controller = $controller('ESNSearchAdvancedFormController', { $scope: $scope });

    controller.$onInit();
    $scope.$digest();

    return controller;
  }

  describe('The clearAdvancedQuery function', function() {
    it('should #esnSearchQueryService.clearAdvancedQuery to clear avanced query', function() {
      var query = { foo: 'bar' };

      esnSearchQueryService.buildFromState = function() {
        return query;
      };

      var controller = initController();

      controller.clearAdvancedQuery();

      expect(esnSearchQueryService.clearAdvancedQuery).to.have.been.calledOnce;
      expect(esnSearchQueryService.clearAdvancedQuery).to.have.been.calledWith(query);
    });
  });

  describe('The onProviderSelected function', function() {
    var controller;
    var mockProviders = [
      { id: '123' },
      { id: '234' }
    ];

    beforeEach(function() {
      controller = initController();
    });

    it('should not call #esnSearchQueryService.clearAdvancedQuery when the old provider is undefined and/or no new provider is provided', function() {
      controller.onProviderSelected(mockProviders[0]);

      controller.onProviderSelected();

      controller.provider = mockProviders[0];
      controller.onProviderSelected();

      expect(esnSearchQueryService.clearAdvancedQuery).to.not.have.been.called;
    });

    it('should not call #esnSearchQueryService.clearAdvancedQuery when the new provider is the same as the old provider', function() {
      controller.provider = mockProviders[0];

      controller.onProviderSelected(mockProviders[0]);

      expect(esnSearchQueryService.clearAdvancedQuery).to.not.have.been.called;
    });

    it('should call #esnSearchQueryService.clearAdvancedQuery and change the provider when the new provider is different from the old provider', function() {
      controller.provider = mockProviders[0];

      controller.onProviderSelected(mockProviders[1]);

      expect(controller.provider).to.deep.equal(mockProviders[1]);
      expect(esnSearchQueryService.clearAdvancedQuery).to.have.been.called;
    });
  });
});
