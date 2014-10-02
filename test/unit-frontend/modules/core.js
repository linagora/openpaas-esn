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
      expect(bytes(size)).to.equal('1.5KB');
      expect(bytes(size, 2)).to.equal('1.50KB');
    });

    it('should recognize bytes', function() {
      expect(bytes(1, 0)).to.equal('1bytes');
    });

    it('should recognize KiloBytes', function() {
      expect(bytes(Math.pow(1024, 1), 0)).to.equal('1KB');
    });

    it('should recognize MegaBytes', function() {
      expect(bytes(Math.pow(1024, 2), 0)).to.equal('1MB');
    });

    it('should recognize GigaBytes', function() {
      expect(bytes(Math.pow(1024, 3), 0)).to.equal('1GB');
    });

    it('should recognize TeraBytes', function() {
      expect(bytes(Math.pow(1024, 4), 0)).to.equal('1TB');
    });

    it('should recognize PetaBytes', function() {
      expect(bytes(Math.pow(1024, 5), 0)).to.equal('1PB');
    });
  });

  describe('The inSlicesOf filter', function() {
    var slices;

    beforeEach(inject(function($filter) {
      slices = $filter('inSlicesOf');
    }));

    it('should do nothing when input is not array', function() {
      expect(slices(null)).to.be.null;
    });

    it('should slice the input array in arrays of N elements', function() {
      var input = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      var out = slices(input, 3);
      expect(out).to.exist;
      expect(out.length).to.equal(3);
      expect(out[0].length).to.equal(3);
      expect(out[1].length).to.equal(3);
      expect(out[2].length).to.equal(3);
    });

    it('should slice the input array in arrays of 3 elements when size if not defined', function() {
      var input = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      var out = slices(input);
      expect(out).to.exist;
      expect(out.length).to.equal(3);
      expect(out[0].length).to.equal(3);
      expect(out[1].length).to.equal(3);
      expect(out[2].length).to.equal(3);
    });

    it('should slice the input array in arrays of N elements when possible', function() {
      var input = [1, 2, 3, 4, 5, 6, 7];
      var out = slices(input, 2);
      expect(out).to.exist;
      expect(out.length).to.equal(4);
      expect(out[0].length).to.equal(2);
      expect(out[1].length).to.equal(2);
      expect(out[2].length).to.equal(2);
      expect(out[3].length).to.equal(1);
    });
  });
});
