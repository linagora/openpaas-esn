'use strict';

/* global chai: false */
/* global async: false */

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
      var pager = this.paginator([], 5, 10, loader);
      pager.nextPage();
    });

    it('should call the loader on previous', function(done) {
      var loader = {
        getItems: function(offset, size, callback) {
          return done();
        }
      };
      var pager = this.paginator([], 5, 10, loader);
      pager.previousPage();
    });

    it('should call the loader on current', function(done) {
      var loader = {
        getItems: function(offset, size, callback) {
          return done();
        }
      };
      var pager = this.paginator([], 5, 10, loader);
      pager.currentPage();
    });

    it('should call the loader with valid offset and limit', function(done) {
      var loader = {
        getItems: function(items, offset, limit, callback) {
          expect(items).to.deep.equal(['1']);
          expect(limit).to.equal(5);
          expect(offset).to.equal(0);
          return done();
        }
      };
      var pager = this.paginator(['1'], 5, 10, loader);
      pager.currentPage();
    });

    it('should call the loader with valid offset and limit N times', function(done) {
      var call = 0;
      var loader = {
        getItems: function(items, offset, limit, callback) {
          call++;
          expect(limit).to.equal(5);
          expect(offset).to.equal(call * 5);
          return callback();
        }
      };
      var pager = this.paginator(['1'], 5, 25, loader);
      pager.nextPage(function() {
        pager.nextPage(function() {
          expect(call).to.equal(2);
          return done();
        });
      });
    });

    it('should cache last loader result', function(done) {
      var result = [1, 2, 3];
      var loader = {
        getItems: function(items, offset, limit, callback) {
          return callback(null, result);
        }
      };
      var pager = this.paginator(result, 5, 25, loader);
      pager.nextPage(function() {
        expect(pager.getItems()).to.deep.equal(result);
        done();
      });
    });

    it('should paginate and load nextItems when reaching last page of the cache', function(done) {
      var result = [1, 2, 3, 4, 5, 6];
      var loader = {
        getItems: function(items, offset, limit, callback) {
          return callback(null, items.slice(offset, offset + limit));
        },
        loadNextItems: function(callback) {
          return callback(null, [7, 8, 9]);
        }
      };
      var pager = this.paginator(result, 2, 9, loader);
      async.series([
        function(callback) {
          pager.currentPage(function(err, items, currentPage) {
            expect(pager.getItems()).to.deep.equal([1, 2, 3, 4, 5, 6]);
            expect(pager.getLastPage()).to.equal(5);
            expect(pager.getLastPageInCache()).to.equal(3);
            expect(pager.getTotalItems()).to.equal(9);
            expect(currentPage).to.equal(1);
            expect(items).to.deep.equal([1, 2]);
            callback();
          });
        },
        function(callback) {
          pager.nextPage(function(err, items, currentPage) {
            expect(pager.getItems()).to.deep.equal([1, 2, 3, 4, 5, 6]);
            expect(pager.getLastPage()).to.equal(5);
            expect(pager.getLastPageInCache()).to.equal(3);
            expect(currentPage).to.equal(2);
            expect(items).to.deep.equal([3, 4]);
            callback();
          });
        },
        function(callback) {
          pager.nextPage(function(err, items, currentPage) {
            expect(pager.getItems()).to.deep.equal([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            expect(pager.getLastPage()).to.equal(5);
            expect(pager.getLastPageInCache()).to.equal(5);
            expect(currentPage).to.equal(3);
            expect(items).to.deep.equal([5, 6]);
            callback();
          });
        },
        function(callback) {
          pager.previousPage(function(err, items, currentPage) {
            expect(pager.getItems()).to.deep.equal([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            expect(pager.getLastPage()).to.equal(5);
            expect(pager.getLastPageInCache()).to.equal(5);
            expect(currentPage).to.equal(2);
            expect(items).to.deep.equal([3, 4]);
            callback();
          });
        },
        function(callback) {
          pager.nextPage(function(err, items, currentPage) {
            expect(pager.getItems()).to.deep.equal([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            expect(pager.getLastPage()).to.equal(5);
            expect(pager.getLastPageInCache()).to.equal(5);
            expect(currentPage).to.equal(3);
            expect(items).to.deep.equal([5, 6]);
            callback();
          });
        },
        function(callback) {
          pager.nextPage(function(err, items, currentPage) {
            expect(pager.getItems()).to.deep.equal([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            expect(pager.getLastPage()).to.equal(5);
            expect(pager.getLastPageInCache()).to.equal(5);
            expect(currentPage).to.equal(4);
            expect(items).to.deep.equal([7, 8]);
            callback();
          });
        },
        function(callback) {
          pager.nextPage(function(err, items, currentPage) {
            expect(pager.getItems()).to.deep.equal([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            expect(pager.getLastPage()).to.equal(5);
            expect(pager.getLastPageInCache()).to.equal(5);
            expect(currentPage).to.equal(5);
            expect(items).to.deep.equal([9]);
            callback();
          });
        }
      ], function(err) {
        if (err) {
          done(err);
        }
        done();
      });
    });
  });
});
