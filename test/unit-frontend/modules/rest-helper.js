'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.rest.helper Angular module', function() {
  describe('filteredcursor service', function() {
    beforeEach(function() {
      angular.mock.module('esn.rest.helper');
    });
    beforeEach(inject(function(filteredcursor, restcursor, $rootScope) {
      this.frc = filteredcursor;
      this.rc = restcursor;
      this.$rootScope = $rootScope;
    }));

    it('should be a function', function() {
      expect(this.frc).to.be.a.function;
    });

    it('should return an object, having endOfStream and nextItems property', function() {
      var cursor = this.frc({}, 10, {});
      expect(cursor).to.have.property('endOfStream');
      expect(cursor).to.respondTo('nextItems');
    });

    describe('nextItems method', function() {
      it('should call the underlaying api until it got enough elements', function(done) {
        var $rootScope = this.$rootScope;
        var apicalls = 0;
        var data = [
          {data: [1, 2, 3, 4, 5]},
          {data: [11, 12, 13, 14, 15]},
          {data: [21, 22, 23, 24, 25]},
          {data: [31, 32, 33, 34, 35]}
        ];

        var options = {
          filter: function(item) { return (item % 5 === 0); }
        };

        function api() {
          apicalls++;
          return $q.when(data.shift());
        }
        var c = this.rc(api, 5);
        var cursor = this.frc(c, 3, options);
        cursor.nextItems(function(err, resp) {
          expect(apicalls).to.equal(3);
          expect(resp).to.deep.equal([5, 15, 25]);
          done();
        });
        $rootScope.$digest();

      });

      it('should call the underlaying api until the end', function(done) {
        var $rootScope = this.$rootScope;
        var apicalls = 0;
        var data = [
          {data: [1, 2, 3, 4, 5]},
          {data: [11, 12, 13, 14, 15]},
          {data: [21, 22, 23, 24, 25]},
          {data: [31, 32, 33, 34, 35]},
          {data: []}
        ];

        var options = {
          filter: function(item) { return (item % 5 === 0); }
        };

        function api() {
          apicalls++;
          return $q.when(data.shift());
        }
        var c = this.rc(api, 5);
        var cursor = this.frc(c, 3, options);
        cursor.nextItems(function(err, resp) {
          expect(apicalls).to.equal(3);
          expect(resp).to.deep.equal([5, 15, 25]);
          cursor.nextItems(function(err, resp) {
            expect(resp).to.deep.equal([35]);
            expect(cursor.endOfStream).to.be.true;
            expect(cursor.offset).to.equal(4);
            done();
          });
        });
        $rootScope.$digest();

      });
    });



  });
  describe('restcursor service', function() {
    beforeEach(function() {
      angular.mock.module('esn.rest.helper');
    });
    beforeEach(inject(function(restcursor, $rootScope) {
      this.restcursor = restcursor;
      this.$rootScope = $rootScope;
    }));

    it('should be a function', function() {
      expect(this.restcursor).to.be.a.function;
    });

    it('should return an object, having endOfStream and nextItems property', function() {
      var cursor = this.restcursor({}, 10, {});
      expect(cursor).to.have.property('endOfStream');
      expect(cursor).to.respondTo('nextItems');
    });

    describe('nextItems method', function() {
      it('should call api with default apiArgs', function(done) {
        var options = {
          apiArgs: {someVar: true}
        };
        function api(options) {
          expect(options).to.deep.equal({someVar: true});
          done();
        }

        var cursor = this.restcursor(api, 10, options);
        cursor.nextItems();
      });

      it('should return results from the API', function(done) {
        function api(options) {
          return $q.when({ data: [1, 2, 3] });
        }

        var cursor = this.restcursor(api, 3, {});
        cursor.nextItems(function(err, results) {
          expect(err).to.be.null;
          expect(results).to.deep.equal([1, 2, 3]);
          done();
        });
        this.$rootScope.$digest();

      });

      it('should set endOfStream to true if number of results < limit', function(done) {
        function api(options) {
          return $q.when({ data: [1, 2] });
        }

        var cursor = this.restcursor(api, 3, {});
        cursor.nextItems(function(err, results) {
          expect(err).to.be.null;
          expect(cursor.endOfStream).to.be.true;
          done();
        });
        this.$rootScope.$digest();

      });

      it('should set endOfStream to true if number of results === 0', function(done) {
        var $rootScope = this.$rootScope;
        var apicalls = 0;
        function api(options) {
          var response;
          if (!apicalls) {
            response = [1, 2, 3];
            apicalls++;
          } else {
            response = [];
          }
          return $q.when({ data: response });
        }

        var cursor = this.restcursor(api, 3, {});
        cursor.nextItems(function(err, results) {
          expect(err).to.be.null;
          expect(cursor.endOfStream).to.be.false;
          cursor.nextItems(function(err, results) {
            expect(err).to.be.null;
            expect(results).to.have.length(0);
            expect(cursor.endOfStream).to.be.true;
            done();
          });
        });
        $rootScope.$digest();
      });

      it('should call api the 2nd time with updated offset', function(done) {
        var apicalls = 0;
        function api(options) {
          if (!apicalls) {
            apicalls++;
            return $q.when({data: [1, 2, 3]});
          }
          expect(options.offset).to.equal(3);
          done();
        }

        var cursor = this.restcursor(api, 3, {});
        cursor.nextItems(function(err, results) {
          expect(err).to.be.null;
          cursor.nextItems(function() {});
        });
        this.$rootScope.$digest();

      });

      it('should use options.updateApiArgs to update the offset', function(done) {
        var apicalls = 0;

        var options = {
          updateApiArgs: function(c, items, args) {
            args.before = items.join(',');
          }
        };

        function api(options) {
          if (!apicalls) {
            apicalls++;
            return $q.when({ data: [1, 2, 3] });
          }
          expect(options.before).to.equal('1,2,3');
          done();
        }

        var cursor = this.restcursor(api, 3, options);
        cursor.nextItems(function(err, results) {
          expect(err).to.be.null;
          cursor.nextItems(function() {});
        });
        this.$rootScope.$digest();
      });

      describe('noEndOfStream option', function() {
        it('should not set endOfStream to true if number of results < limit', function(done) {
          function api(options) {
            return $q.when({ data: [1, 2] });
          }

          var cursor = this.restcursor(api, 3, {noEndOfStream: true});
          cursor.nextItems(function(err, results) {
            expect(err).to.be.null;
            expect(cursor.endOfStream).to.be.false;
            done();
          });
          this.$rootScope.$digest();
        });

        it('should call the underlying API even after a call with no results', function(done) {
          var data = [];
          function api(options) {
            return $q.when({ data: data });
          }

          var cursor = this.restcursor(api, 3, {noEndOfStream: true});
          cursor.nextItems(function(err, results) {
            expect(err).to.be.null;
            expect(cursor.endOfStream).to.be.false;
            data = [1, 5];
            cursor.nextItems(function(err, results) {
              expect(err).to.be.null;
              expect(cursor.endOfStream).to.be.false;
              expect(results).to.deep.equal(data);
              done();
            });
          });
          this.$rootScope.$digest();
        });

      });

    });

  });


});
