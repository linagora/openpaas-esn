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

      it('should force lastPage if rejected', function(done) {
        var id = 123;

        var wrapper = new this.PageAggregatorSourceWrapper({
          id: id,
          loadNextItems: function() {
            return $q.reject(new Error('this is an error'));
          }
        });

        wrapper.loadNextItems().then(function() {
          done(new Error('should not be here'));
        }, function() {
          expect(wrapper.lastPage).to.be.true;
          done();
        });
        $rootScope.$apply();
      });

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
        var id = 123;

        var wrapper = new this.PageAggregatorSourceWrapper({
          id: id,
          loadNextItems: function() {
            return $q.when({data: data, lastPage: true});
          }
        });

        wrapper.loadNextItems().then(function(result) {
          expect(result).to.deep.equal({id: id, lastPage: true, data: data});
          done();
        }, done);
        $rootScope.$apply();
      });

      it('should return lastPage to false when lastPage is not defined in source result', function(done) {
        var data = [1, 2, 3];
        var id = 123;

        var wrapper = new this.PageAggregatorSourceWrapper({
          id: id,
          loadNextItems: function() {
            return $q.when({data: data});
          }
        });

        wrapper.loadNextItems().then(function(result) {
          expect(result).to.deep.equal({id: id, lastPage: false, data: data});
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
        inject(function(PageAggregatorService, AGGREGATOR_DEFAULT_RESULTS_PER_PAGE, AGGREGATOR_DEFAULT_FIRST_PAGE_SIZE, _$rootScope_) {
          this.PageAggregatorService = PageAggregatorService;
          this.AGGREGATOR_DEFAULT_RESULTS_PER_PAGE = AGGREGATOR_DEFAULT_RESULTS_PER_PAGE;
          this.AGGREGATOR_DEFAULT_FIRST_PAGE_SIZE = AGGREGATOR_DEFAULT_FIRST_PAGE_SIZE;

          $rootScope = _$rootScope_;
        });
      });

      it('should wrap the sources', function() {
        var aggregator = new this.PageAggregatorService('test', [1, 2], {});

        expect(aggregator.wrappedSources.length).to.equal(2);
      });

      it('should set default options when undefined', function() {
        var aggregator = new this.PageAggregatorService('test', []);

        expect(aggregator.options).to.deep.equal({
          results_per_page: this.AGGREGATOR_DEFAULT_RESULTS_PER_PAGE,
          first_page_size: this.AGGREGATOR_DEFAULT_FIRST_PAGE_SIZE
        });
      });

      it('should set the results_per_page options when not defined', function() {
        var aggregator = new this.PageAggregatorService('test', [], { first_page_size: 5 });

        expect(aggregator.options).to.deep.equal({
          results_per_page: this.AGGREGATOR_DEFAULT_RESULTS_PER_PAGE,
          first_page_size: 5
        });
      });

      it('should support results_per_page and first_page_size options', function() {
        var aggregator = new this.PageAggregatorService('test', [], { results_per_page: 1, first_page_size: 5 });

        expect(aggregator.options).to.deep.equal({
          results_per_page: 1,
          first_page_size: 5
        });
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
        var item = {foo: 'bar'},
            hasNext = false,
            aggregator = new this.PageAggregatorService(name, [], {compare: compare});

        aggregator.hasNext = function() {
          return (hasNext = !hasNext);
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
          expect(result).to.deep.equal({
            id: name,
            firstPage: true,
            lastPage: false,
            data: [item]
          });
          done();
        }, done);
        $rootScope.$apply();
      });

      it('should resolve when first page size is reached', function(done) {
        var item = {foo: 'bar'},
            aggregator = new this.PageAggregatorService(name, [], { compare: compare, first_page_size: 3 });

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
          expect(result).to.deep.equal({
            id: name,
            firstPage: true,
            lastPage: false,
            data: [item, item, item]
          });
          done();
        }, done);

        $rootScope.$apply();
      });

      it('should resolve when page size is reached', function(done) {
        var item = {foo: 'bar'},
            aggregator = new this.PageAggregatorService(name, [], { compare: compare, results_per_page: 2 });

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

        // Consume first page
        aggregator.loadNextItems();
        $rootScope.$apply();

        aggregator.loadNextItems().then(function(result) {
          expect(result).to.deep.equal({
            id: name,
            firstPage: false,
            lastPage: false,
            data: [item, item]
          });
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

          var aggregator = new this.PageAggregatorService('test', sources, {compare: compare, first_page_size: 5, results_per_page: 5});

          aggregator.loadNextItems().then(function(results) {
            expect(results).to.deep.equal({
              id: 'test', firstPage: true, lastPage: false, data: [
                {id: 1, value: 'A'},
                {id: 1, value: 'A'},
                {id: 2, value: 'B'},
                {id: 4, value: 'D'},
                {id: 5, value: 'E'}
              ]
            });

            aggregator.loadNextItems().then(function(results) {

              expect(results).to.deep.equal({
                id: 'test', firstPage: false, lastPage: false, data: [
                  {id: 6, value: 'F'},
                  {id: 7, value: 'G'},
                  {id: 8, value: 'H'},
                  {id: 24, value: 'X'},
                  {id: 25, value: 'Y'}
                ]
              });

              aggregator.loadNextItems().then(function(results) {
                expect(results).to.deep.equal({
                  id: 'test', firstPage: false, lastPage: true, data: [
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

          var aggregator = new this.PageAggregatorService('test', sources, {compare: compare, first_page_size: 20, results_per_page: 20});

          aggregator.loadNextItems().then(function(results) {
            expect(results).to.deep.equal({
              id: 'test', firstPage: true, lastPage: true, data: [
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

    describe('the loadRecentItems function', function() {

      var $rootScope,
          PageAggregatorService,
          sourceWithLoadRecentItems = function(items) {
            return {
              loadRecentItems: function() {
                return $q.when(items);
              }
            };
          },
          sourceWithoutLoadRecentItems = {};

      beforeEach(inject(function(_PageAggregatorService_, _$rootScope_) {
        PageAggregatorService = _PageAggregatorService_;
        $rootScope = _$rootScope_;
      }));

      it('should return an empty Array when there is no sources', function(done) {
        new PageAggregatorService('id', []).loadRecentItems().then(function(results) {
          expect(results).to.deep.equal([]);

          done();
        });

        $rootScope.$digest();
      });

      it('should return an empty Array when sources have no loadRecentItems function', function(done) {
        new PageAggregatorService('id', [sourceWithoutLoadRecentItems]).loadRecentItems().then(function(results) {
          expect(results).to.deep.equal([]);

          done();
        });

        $rootScope.$digest();
      });

      it('should return the recent items, correctly sorted', function(done) {
        var itemsFirstSource = [{ value: 2 }, { value: 1 }],
            itemsSecondSource = [{ value: 3 }, { value: 0 }];

        new PageAggregatorService('id', [
          sourceWithLoadRecentItems(itemsFirstSource),
          sourceWithLoadRecentItems(itemsSecondSource)
        ], {
          compare: function(a, b) {
            return a.value - b.value;
          }
        }).loadRecentItems().then(function(results) {
          expect(results).to.deep.equal([{ value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }]);

          done();
        });

        $rootScope.$digest();
      });

    });

    describe('the bidirectionalFetcher function', function() {

      var $rootScope,
          PageAggregatorService,
          sourceWithLoadRecentItems = {
            loadNextItems: function() {
              return $q.when({ data: [{ a: 'old' }], lastPage: true });
            },
            loadRecentItems: function() {
              return $q.when([{ a: 'recent' }]);
            }
          };

      beforeEach(inject(function(_PageAggregatorService_, _$rootScope_) {
        PageAggregatorService = _PageAggregatorService_;
        $rootScope = _$rootScope_;
      }));

      it('should return a function', function() {
        expect(new PageAggregatorService('id', []).bidirectionalFetcher()).to.be.a('function');
      });

      it('should return a function having a loadRecentItems function property', function() {
        expect(new PageAggregatorService('id', []).bidirectionalFetcher().loadRecentItems).to.be.a('function');
      });

      it('should fetch items when called', function(done) {
        var service = new PageAggregatorService('id', [sourceWithLoadRecentItems]);

        service.bidirectionalFetcher()().then(function(result) {
          expect(result).to.deep.equal([{ a: 'old' }]);

          done();
        });

        $rootScope.$digest();
      });

      it('should fetch recent items when loadRecentItems is called', function(done) {
        var service = new PageAggregatorService('id', [sourceWithLoadRecentItems]);

        service.bidirectionalFetcher().loadRecentItems().then(function(result) {
          expect(result).to.deep.equal([{ a: 'recent' }]);

          done();
        });

        $rootScope.$digest();
      });

    });

  });
});
