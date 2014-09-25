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

  describe('The bytes filter', function() {

    var bytes;
    beforeEach(inject(function($filter) {
      bytes = $filter('bytes');
    }));

    it('should return nothing when there is no filesize', function() {
      expect(bytes('text')).to.equal('-');
    });

    it('should round the filesize based on the configured precision', function() {
      var size = 1024 + 512;
      expect(bytes(size)).to.equal('1.5 kB');
      expect(bytes(size, 2)).to.equal('1.50 kB');
    });

    it('should recognize bytes', function() {
      expect(bytes(1, 0)).to.equal('1 bytes');
    });

    it('should recognize KiloBytes', function() {
      expect(bytes(Math.pow(1024, 1), 0)).to.equal('1 kB');
    });

    it('should recognize MegaBytes', function() {
      expect(bytes(Math.pow(1024, 2), 0)).to.equal('1 MB');
    });

    it('should recognize GigaBytes', function() {
      expect(bytes(Math.pow(1024, 3), 0)).to.equal('1 GB');
    });

    it('should recognize TeraBytes', function() {
      expect(bytes(Math.pow(1024, 4), 0)).to.equal('1 TB');
    });

    it('should recognize PetaBytes', function() {
      expect(bytes(Math.pow(1024, 5), 0)).to.equal('1 PB');
    });
  });
});
