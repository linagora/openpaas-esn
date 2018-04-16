'use strict';

/* global chai */

var expect = chai.expect;

describe('The ESNSearchHeaderSettingsController', function() {
  var $stateParams, $controller, $scope, $rootScope, searchProviders;

  beforeEach(function() {
    angular.mock.module('esn.search', function($provide) {
      $provide.value('$stateParams', $stateParams = {});
    });
  });

  function initController() {
    $scope = {};
    $controller('ESNSearchHeaderSettingsController', {$scope: $scope});
    $rootScope.$digest();
  }

  beforeEach(inject(function(_$controller_, _$rootScope_, _$stateParams_, _searchProviders_) {
    $controller = _$controller_;
    $rootScope = _$rootScope_;
    $stateParams = _$stateParams_;
    searchProviders = _searchProviders_;

    searchProviders.add({ id: '123', name: 'cat' });
    searchProviders.add({ id: '456', name: 'dog' });

    initController();
  }));

  describe('init function', function() {
    it('should create a new filters Array when initializing ctrl with no stateParams.filters', function() {
      expect($scope.filters).to.deep.equal([
        { id: '123', name: 'cat', checked: true },
        { id: '456', name: 'dog', checked: true }
      ]);
    });

    it('should create a new filters Array with existing filters when initializing ctrl with stateParams.filters', function() {
      var filters = [
        { id: '123', name: 'platypus', checked: true },
        { id: '456', name: 'penguin', checked: false }
      ];
      $stateParams.filters = filters;
      initController();

      expect($scope.filters).to.deep.equal(filters);
    });
  });

  describe('toggleAll function', function() {
    it('should toggle checked params of every filter when toggleAll is called', function() {
      $scope.all = false;
      $scope.toggleAll();

      expect($scope.filters).to.deep.equal([
        { id: '123', name: 'cat', checked: false },
        { id: '456', name: 'dog', checked: false }
      ]);

      $scope.all = true;
      $scope.toggleAll();

      expect($scope.filters).to.deep.equal([
        { id: '123', name: 'cat', checked: true },
        { id: '456', name: 'dog', checked: true }
      ]);
    });
  });

  describe('updateFilters function', function() {
    it('should assign false to scope.all when at least one filter is unchecked', function() {
      $scope.filters = [
        { id: '123', name: 'cat', checked: false },
        { id: '456', name: 'dog', checked: true }
      ];
      $scope.updateFilters();

      expect($scope.all).to.equal(false);
    });

    it('should save filters in $stateParams when updating filters', function() {
      $scope.filters = [
        { id: '123', name: 'platypus', checked: true },
        { id: '456', name: 'penguin', checked: false }
      ];

      $scope.updateFilters();

      expect($stateParams.filters).to.be.deep.equal($scope.filters);
    });
  });
});
