'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Paginate Angular module', function() {

  beforeEach(angular.mock.module('esn.paginate'));
  beforeEach(inject(function(paginator) {
    this.paginator = paginator;
  }));

  describe('Paginator service', function() {
    it('should throws error when loader is not set', function(done) {
      expect(this.paginator).to.throw(Error);
      done();
    });

    it('should call the loader on next', function(done) {
      var loader = {
        getItems: function(offset, size, callback) {
          return done();
        }
      };
      var pager = this.paginator(10, loader);
      pager.nextPage();
    });

    it('should call the loader on previous', function(done) {
      var loader = {
        getItems: function(offset, size, callback) {
          return done();
        }
      };
      var pager = this.paginator(10, loader);
      pager.previousPage();
    });

    it('should call the loader on current', function(done) {
      var loader = {
        getItems: function(offset, size, callback) {
          return done();
        }
      };
      var pager = this.paginator(10, loader);
      pager.currentPage();
    });

    it('should call the loader with valid offset and limit', function(done) {
      var length = 10;
      var loader = {
        getItems: function(offset, size, callback) {
          expect(size).to.equal(length);
          expect(offset).to.equal(0);
          return done();
        }
      };
      var pager = this.paginator(length, loader);
      pager.currentPage();
    });

    it('should call the loader with valid offset and limit N times', function(done) {
      var call = 0;
      var length = 10;
      var loader = {
        getItems: function(offset, size, callback) {
          call++;
          expect(size).to.equal(length);
          expect(offset).to.equal(call * length);
          return callback();
        }
      };
      var pager = this.paginator(length, loader);
      pager.nextPage(function() {
        pager.nextPage(function() {
          expect(call).to.equal(2);
          return done();
        });
      });
    });

    it('should cache last loader result', function(done) {
      var result = [1, 2, 3];
      var length = 10;
      var loader = {
        getItems: function(offset, size, callback) {
          return callback(null, result);
        }
      };
      var pager = this.paginator(length, loader);
      pager.nextPage(function() {
        expect(pager.getItems()).to.deep.equal(result);
        done();
      });
    });
  });
});
