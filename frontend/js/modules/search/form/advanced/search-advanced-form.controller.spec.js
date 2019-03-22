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

  });

  function initController() {
    var $scope = $rootScope.$new();

    var controller = $controller('ESNSearchAdvancedFormController', { $scope: $scope });

    controller.$onInit();
    $scope.$digest();

    return controller;
  }

  describe('The onProviderSelected function', function() {
    it('should #esnSearchQueryService.clearAdvancedQuery to clear avanced query', function() {
      var query = { foo: 'bar' };

      esnSearchQueryService.buildFromState = function() {
        return query;
      };
      esnSearchQueryService.clearAdvancedQuery = sinon.stub();

      var controller = initController();

      controller.clearAdvancedQuery();

      expect(esnSearchQueryService.clearAdvancedQuery).to.have.been.calledOnce;
      expect(esnSearchQueryService.clearAdvancedQuery).to.have.been.calledWith(query);
    });
  });
});
