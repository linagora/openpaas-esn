'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Aggregator module', function() {

  beforeEach(module('esn.aggregator'));

  describe('PageAggregatorSourceWrapper service', function() {

    describe('the hasNext function', function() {

      var $rootScope;

      beforeEach(angular.mock.inject(function(PageAggregatorSourceWrapper, _$rootScope_) {
        this.PageAggregatorSourceWrapper = PageAggregatorSourceWrapper;
        $rootScope = _$rootScope_;
      }));

      it('should return true after instantiation', function() {
        var wrapper = new this.PageAggregatorSourceWrapper({});
        expect(wrapper.hasNext()).to.be.true;
      });

      it('should return true when source#loadNextItem call does not send back lastPage', function(done) {
        var wrapper = new this.PageAggregatorSourceWrapper({
          loadNextItems: function() {
            return $q.when({data: [1]});
          }
        });

        wrapper.loadNextItems().then(function() {
          expect(wrapper.hasNext()).to.be.true;
          done();
        });

        $rootScope.$apply();
      });
    });

    describe('the loadNextItems function', function() {

      var $rootScope;

      beforeEach(angular.mock.inject(function(PageAggregatorSourceWrapper, _$rootScope_) {
        this.PageAggregatorSourceWrapper = PageAggregatorSourceWrapper;
        $rootScope = _$rootScope_;
      }));

      it('should reject when !hasNext', function(done) {
        var data = [1, 2, 3];
        var id = 123;

        var wrapper = new this.PageAggregatorSourceWrapper({
          id: id,
          loadNextItems: function() {
            return $q.when({data: data});
          }
        });
        wrapper.hasNext = function() {
          return false;
        };

        wrapper.loadNextItems().then(function() {
          done(new Error());
        }, function(err) {
          expect(err.message).to.match(/No more pages on source/);
          done();
        });
        $rootScope.$apply();
      });

      it('should call the source#loadNextItems function', function(done) {
        var opts = {foo: 'bar'};
        var source = {
          loadNextItems: function(options) {
            expect(options).to.deep.equal(opts);
            done();
          }
        };

        var wrapper = new this.PageAggregatorSourceWrapper(source);
        wrapper.loadNextItems(opts);
        $rootScope.$apply();
      });

      it('should return wrapped source data', function(done) {
        var data = [1, 2, 3];
        var nextPage = 4;
        var id = 123;

        var wrapper = new this.PageAggregatorSourceWrapper({
          id: id,
          loadNextItems: function() {
            return $q.when({data: data, nextPage: nextPage});
          }
        });

        wrapper.loadNextItems().then(function(result) {
          expect(result).to.deep.equal({id: id, hasNext: true, data: data});
          done();
        }, done);
        $rootScope.$apply();
      });

      it('should return hasNext to true when lastPage is not defined in source result', function(done) {
        var data = [1, 2, 3];
        var id = 123;

        var wrapper = new this.PageAggregatorSourceWrapper({
          id: id,
          loadNextItems: function() {
            return $q.when({data: data});
          }
        });

        wrapper.loadNextItems().then(function(result) {
          expect(result).to.deep.equal({id: id, hasNext: true, data: data});
          expect(wrapper.hasNext()).to.be.true;
          done();
        }, done);
        $rootScope.$apply();
      });
    });
  });

  describe('PageAggregatorService service', function() {

    var $rootScope = {};

    var compare = function(a, b) {
      var valueA = a.value.toLowerCase();
      var valueB = b.value.toLowerCase();
      if (valueA < valueB) {
        return -1;
      }

      if (valueA > valueB) {
        return 1;
      }

      return 0;
    };

    var SourceMock = function(id, mockData) {
      this.id = id;
      this.mockData = mockData;
      this.currentCalls = 0;
    };

    SourceMock.prototype.loadNextItems = function() {
      var current = this.currentCalls;
      this.currentCalls++;
      return $q.when({lastPage: this.currentCalls >= this.mockData.length, data: this.mockData[current]});
    };

    describe('the constructor', function() {
      beforeEach(function() {
        inject(function(PageAggregatorService, AGGREGATOR_DEFAULT_RESULTS_PER_PAGE, _$rootScope_) {
          this.PageAggregatorService = PageAggregatorService;
          this.AGGREGATOR_DEFAULT_RESULTS_PER_PAGE = AGGREGATOR_DEFAULT_RESULTS_PER_PAGE;
          $rootScope = _$rootScope_;
        });
      });

      it('should wrap the sources', function() {
        var aggregator = new this.PageAggregatorService('test', [1, 2], {});
        expect(aggregator.wrappedSources.length).to.equal(2);
      });

      it('should set default options when undefined', function() {
        var aggregator = new this.PageAggregatorService('test', []);
        expect(aggregator.options).to.deep.equal({results_per_page: this.AGGREGATOR_DEFAULT_RESULTS_PER_PAGE});
      });

      it('should set the results_per_page options when not defined', function() {
        var aggregator = new this.PageAggregatorService('test', [], {});
        expect(aggregator.options).to.deep.equal({results_per_page: this.AGGREGATOR_DEFAULT_RESULTS_PER_PAGE});
      });
    });

    describe('the _sourcesHaveData function', function() {

      beforeEach(function() {
        inject(function(PageAggregatorService, _$rootScope_) {
          this.PageAggregatorService = PageAggregatorService;
          $rootScope = _$rootScope_;
        });
      });

      it('should send false after instantiation', function() {
        var aggregator = new this.PageAggregatorService('test', [], {});
        expect(aggregator._sourcesHaveData()).to.be.false;
      });

      it('should send true when data is available in a source', function() {
        var aggregator = new this.PageAggregatorService('test', [1, 2], {});
        aggregator.wrappedSources[0].data = [1, 2, 3];
        expect(aggregator._sourcesHaveData()).to.be.true;
      });
    });

    describe('the _sourcesHaveNext function', function() {

      var PageAggregatorSourceWrapperMock;

      beforeEach(function() {
        PageAggregatorSourceWrapperMock = function(source) {
          this.source = source;
        };

        inject(function(PageAggregatorService, _$rootScope_) {
          this.PageAggregatorService = PageAggregatorService;
          $rootScope = _$rootScope_;
        });
      });

      it('should be true when at least a source hasNext', function() {
        var aggregator = new this.PageAggregatorService('test', [1, 2, 3], {compare: compare});
        aggregator.wrappedSources[0].source.hasNext = function() {
          return true;
        };
        expect(aggregator.hasNext()).to.be.true;
      });

      it('should be false when all sources return hasNext == false', function() {
        PageAggregatorSourceWrapperMock.prototype.hasNext = function() {
          return false;
        };
        var aggregator = new this.PageAggregatorService('test', [1, 2, 3], {compare: compare});

        aggregator.wrappedSources.forEach(function(wrappedSource) {
          wrappedSource.source.hasNext = function() {
            return false;
          };
        });

        expect(aggregator.hasNext()).to.be.false;
      });
    });

    describe('the _loadItemsFromSources function', function() {

      beforeEach(function() {
        inject(function(PageAggregatorService, _$rootScope_) {
          this.PageAggregatorService = PageAggregatorService;
          $rootScope = _$rootScope_;
        });
      });

      it('should return cache when it is not empty', function(done) {
        var sources = [
          {
            loadNextItems: function() {
              done(new Error('Should not be called'));
            }
          },
          {
            loadNextItems: function() {
              return $q.when({data: [2]});
            }
          }
        ];
        var aggregator = new this.PageAggregatorService('test', sources, {compare: compare});
        aggregator.wrappedSources[0].data = [1];
        aggregator._loadItemsFromSources().then(function() {
          expect(aggregator.wrappedSources[0].data).to.deep.equal([1]);
          expect(aggregator.wrappedSources[1].data).to.deep.equal([2]);
          done();
        });
        $rootScope.$apply();
      });

      it('should add source data to wrapped source data cache when available', function(done) {
        var sources = [
          {
            loadNextItems: function() {
              return $q.when({data: [1]});
            }
          },
          {
            loadNextItems: function() {
              return $q.when({data: [2]});
            }
          }
        ];
        var aggregator = new this.PageAggregatorService('test', sources, {compare: compare});
        aggregator._loadItemsFromSources().then(function() {
          expect(aggregator.wrappedSources[0].data).to.deep.equal([1]);
          expect(aggregator.wrappedSources[1].data).to.deep.equal([2]);
          done();
        });
        $rootScope.$apply();
      });

      it('should not add data to wrapped source data cache when empty', function(done) {
        var sources = [
          {
            loadNextItems: function() {
              return $q.when({data: []});
            }
          },
          {
            loadNextItems: function() {
              return $q.when({data: [2]});
            }
          }
        ];
        var aggregator = new this.PageAggregatorService('test', sources, {compare: compare});
        aggregator._loadItemsFromSources().then(function() {
          expect(aggregator.wrappedSources[0].data).to.deep.equal([]);
          expect(aggregator.wrappedSources[1].data).to.deep.equal([2]);
          done();
        });
        $rootScope.$apply();
      });

      it('should not add data to wrapped source data cache when undefined', function(done) {
        var sources = [
          {
            loadNextItems: function() {
              return $q.when({});
            }
          },
          {
            loadNextItems: function() {
              return $q.when({data: [2]});
            }
          }
        ];
        var aggregator = new this.PageAggregatorService('test', sources, {compare: compare});
        aggregator._loadItemsFromSources().then(function() {
          expect(aggregator.wrappedSources[0].data).to.deep.equal([]);
          expect(aggregator.wrappedSources[1].data).to.deep.equal([2]);
          done();
        });
        $rootScope.$apply();
      });

      it('should not fail when a promise reject', function(done) {
        var sources = [
          {
            loadNextItems: function() {
              return $q.reject(new Error());
            }
          },
          {
            loadNextItems: function() {
              return $q.when({data: [2]});
            }
          }
        ];
        var aggregator = new this.PageAggregatorService('test', sources, {compare: compare});
        aggregator._loadItemsFromSources().then(function() {
          done();
        }, done);
        $rootScope.$apply();
      });
    });

    describe('the _getSmallerItem function', function() {

      beforeEach(function() {
        inject(function(PageAggregatorService, _$rootScope_) {
          this.PageAggregatorService = PageAggregatorService;
          $rootScope = _$rootScope_;
        });
      });

      it('should return undefined when no items are available', function() {
        var aggregator = new this.PageAggregatorService('test', [1], {compare: compare});
        expect(aggregator._getSmallerItem()).to.be.undefined;
      });

      it('should return undefined when first wrappedSource data is empty', function() {
        var aggregator = new this.PageAggregatorService('test', [1], {compare: compare});
        aggregator.wrappedSources[0].data = [];
        expect(aggregator._getSmallerItem()).to.be.undefined;
        expect(aggregator.wrappedSources[0].data).to.be.empty;
      });

      it('should return non undefined element when a source have data', function() {
        var item = {value: 'a'};
        var aggregator = new this.PageAggregatorService('test', [1, 2], {compare: compare});
        aggregator.wrappedSources[0].data = [];
        aggregator.wrappedSources[1].data = [item];
        expect(aggregator._getSmallerItem()).to.equal(item);
      });

      it('should return the only defined element and empty the cache', function() {
        var item = {value: 'a'};
        var aggregator = new this.PageAggregatorService('test', [1], {compare: compare});
        aggregator.wrappedSources[0].data = [item];
        expect(aggregator._getSmallerItem()).to.deep.equal(item);
        expect(aggregator.wrappedSources[0].data).to.be.empty;
      });

      // the generated array to compare is build from the first elements of arrays a,b & c
      // [{value: 'a'}, {value: 'b'}, {value: 'c'}]
      // The array is already ordered
      it('should return the smaller element from the array based on the compare function and remove it from the cache (ordered)', function() {
        var a = [{value: 'a'}, {value: 'e'}, {value: 'z'}];
        var b = [{value: 'b'}, {value: 'b'}, {value: 'c'}];
        var c = [{value: 'c'}, {value: 'd'}, {value: 'e'}];
        var aggregator = new this.PageAggregatorService('test', [1, 2, 3], {compare: compare});
        aggregator.wrappedSources[0].data = a;
        aggregator.wrappedSources[1].data = b;
        aggregator.wrappedSources[2].data = c;
        expect(aggregator._getSmallerItem()).to.deep.equal({value: 'a'});
        expect(aggregator.wrappedSources[0].data).to.deep.equal([{value: 'e'}, {value: 'z'}]);
        expect(aggregator.wrappedSources[1].data).to.deep.equal(b);
        expect(aggregator.wrappedSources[2].data).to.deep.equal(c);
      });

      // the generated array to compare is build from the first elements of arrays a,b & c
      // [{value: 'c'}, {value: 'b'}, {value: 'a'}]
      // The array is not ordered before processing
      it('should return the smaller element from the array based on the compare function and remove it from the cache (not ordered)', function() {
        var a = [{value: 'a'}, {value: 'e'}, {value: 'z'}];
        var b = [{value: 'b'}, {value: 'b'}, {value: 'c'}];
        var c = [{value: 'c'}, {value: 'd'}, {value: 'e'}];
        var aggregator = new this.PageAggregatorService('test', [1, 2, 3], {compare: compare});
        aggregator.wrappedSources[0].data = c;
        aggregator.wrappedSources[1].data = b;
        aggregator.wrappedSources[2].data = a;
        expect(aggregator._getSmallerItem()).to.deep.equal({value: 'a'});
        expect(aggregator.wrappedSources[0].data).to.deep.equal(c);
        expect(aggregator.wrappedSources[1].data).to.deep.equal(b);
        expect(aggregator.wrappedSources[2].data).to.deep.equal([{value: 'e'}, {value: 'z'}]);
      });

      it('should return the last smaller element', function() {
        var a = [{value: 'a', foo: 'bar'}];
        var b = [{value: 'b'}, {value: 'b'}, {value: 'c'}];
        var c = [{value: 'a', foo: 'baz'}, {value: 'd'}, {value: 'e'}];
        var d = [{value: 'a'}, {value: 'e'}];
        var f = [{value: 'f'}, {value: 'e'}];
        var aggregator = new this.PageAggregatorService('test', [1, 2, 3, 4, 5], {compare: compare});
        aggregator.wrappedSources[0].data = a;
        aggregator.wrappedSources[1].data = b;
        aggregator.wrappedSources[2].data = c;
        aggregator.wrappedSources[3].data = d;
        aggregator.wrappedSources[4].data = f;
        expect(aggregator._getSmallerItem()).to.deep.equal({value: 'a'});
      });
    });

    describe('the loadNextItems function', function() {

      beforeEach(function() {
        inject(function(PageAggregatorService, _$rootScope_) {
          this.PageAggregatorService = PageAggregatorService;
          $rootScope = _$rootScope_;
        });
      });

      it('should reject when no more data is available to fetch', function(done) {
        var aggregator = new this.PageAggregatorService(name, [], {compare: compare});
        aggregator.hasNext = function() {
          return false;
        };

        aggregator.loadNextItems().then(function() {
          done(new Error());
        }, function(err) {
          expect(err.message).to.match(/No more data to fetch/);
          done();
        });
        $rootScope.$apply();
      });

      it('should resolve when sources does not have any more data', function(done) {
        var item = {foo: 'bar'};
        var aggregator = new this.PageAggregatorService(name, [], {compare: compare});
        aggregator.hasNext = function() {
          return true;
        };

        aggregator._loadItemsFromSources = function() {
          return $q.when();
        };

        aggregator._getSmallerItem = function() {
          return item;
        };

        aggregator._sourcesHaveData = function() {
          return false;
        };

        aggregator.loadNextItems().then(function(result) {
          expect(result).to.deep.equal({id: name, hasNext: true, data: [item]});
          done();
        }, done);
        $rootScope.$apply();
      });

      it('should resolve when page size is reached', function(done) {
        var item = {foo: 'bar'};
        var aggregator = new this.PageAggregatorService(name, [], {compare: compare, results_per_page: 2});
        aggregator.hasNext = function() {
          return true;
        };

        aggregator._loadItemsFromSources = function() {
          return $q.when();
        };

        aggregator._getSmallerItem = function() {
          return item;
        };

        aggregator._sourcesHaveData = function() {
          return true;
        };

        aggregator.loadNextItems().then(function(result) {
          expect(result).to.deep.equal({id: name, hasNext: true, data: [item, item]});
          done();
        }, done);

        $rootScope.$apply();
      });

      describe('Functional tests', function() {
        it('should paginate results in the right order', function(done) {

          var a = {id: 1, value: 'A'};
          var b = {id: 2, value: 'B'};
          var d = {id: 4, value: 'D'};
          var e = {id: 5, value: 'E'};
          var f = {id: 6, value: 'F'};
          var g = {id: 7, value: 'G'};
          var h = {id: 8, value: 'H'};
          var x = {id: 24, value: 'X'};
          var y = {id: 25, value: 'Y'};
          var z = {id: 26, value: 'Z'};

          var sources = [
            new SourceMock(1, [[a, b], [e]]),
            new SourceMock(2, [[d, x]]),
            new SourceMock(3, [[z]]),
            new SourceMock(4, [[g, h]]),
            new SourceMock(5, [[a], [f], [y, z]])
          ];

          var aggregator = new this.PageAggregatorService('test', sources, {compare: compare, results_per_page: 5});

          aggregator.loadNextItems().then(function(results) {
            expect(results).to.deep.equal({
              id: 'test', hasNext: true, data: [
                {id: 1, value: 'A'},
                {id: 1, value: 'A'},
                {id: 2, value: 'B'},
                {id: 4, value: 'D'},
                {id: 5, value: 'E'}
              ]
            });

            aggregator.loadNextItems().then(function(results) {

              expect(results).to.deep.equal({
                id: 'test', hasNext: true, data: [
                  {id: 6, value: 'F'},
                  {id: 7, value: 'G'},
                  {id: 8, value: 'H'},
                  {id: 24, value: 'X'},
                  {id: 25, value: 'Y'}
                ]
              });

              aggregator.loadNextItems().then(function(results) {
                expect(results).to.deep.equal({
                  id: 'test', hasNext: false, data: [
                    {id: 26, value: 'Z'},
                    {id: 26, value: 'Z'}
                  ]
                });

                aggregator.loadNextItems().then(function() {
                  done(new Error('Should reject'));
                }, function() {
                  done();
                });
              });
            });
          });
          $rootScope.$apply();
        });

        it('should return all the items in a single page if results_per_page is greater than the number of items', function(done) {

          var a = {id: 1, value: 'A'};
          var b = {id: 2, value: 'B'};
          var d = {id: 4, value: 'D'};
          var e = {id: 5, value: 'E'};
          var x = {id: 24, value: 'X'};

          var sources = [
            new SourceMock(1, [[a, b], [e]]),
            new SourceMock(2, [[d, x]])
          ];

          var aggregator = new this.PageAggregatorService('test', sources, {compare: compare, results_per_page: 20});

          aggregator.loadNextItems().then(function(results) {
            expect(results).to.deep.equal({
              id: 'test', hasNext: false, data: [
                {id: 1, value: 'A'},
                {id: 2, value: 'B'},
                {id: 4, value: 'D'},
                {id: 5, value: 'E'},
                {id: 24, value: 'X'}
              ]
            });
            done();
          });
          $rootScope.$apply();
        });
      });
    });
  });
});
