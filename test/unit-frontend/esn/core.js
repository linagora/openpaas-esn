'use strict';
/* global chai: false */
var expect = chai.expect;

describe('The Angular core module', function() {
  beforeEach(angular.mock.module('esn.core'));

  describe('selectActiveItem controller', function() {
    beforeEach(angular.mock.inject(function($controller, $rootScope) {
      this.$controller = $controller;
      this.scope = $rootScope.$new();
      $controller('selectActiveItem', {
        $scope: this.scope
      });
    }));

    it('should set $scope.selected to 1', function() {
      expect(this.scope.selected).to.equal(1);
    });

    describe('selectItem() function', function() {
      it('should set $scope.selected to the sepcified index', function() {
        this.scope.selectItem(42);
        expect(this.scope.selected).to.equal(42);
      });
    });
  });

});
