'use strict';

/* global chai, sinon: false */
var expect = chai.expect;

describe('The esn.timeline module', function() {
  beforeEach(function() {
    module('jadeTemplates');
    module('esn.timeline');
  });

  describe('The esnTimelineAPI factory', function() {
    beforeEach(angular.mock.inject(function(esnTimelineAPI, $httpBackend) {
      this.$httpBackend = $httpBackend;
      this.esnTimelineAPI = esnTimelineAPI;
    }));

    describe('The getUserTimelineEntries function', function() {
      it('should send request to the right endpoint', function() {
        this.$httpBackend.expectGET('/api/timelineentries').respond([]);
        this.esnTimelineAPI.getUserTimelineEntries();
        this.$httpBackend.flush();
      });
    });
  });

  describe('The esnTimelineEntryProviders factory', function() {
    var service;

    beforeEach(function() {
      inject(function($injector) {
        service = $injector.get('esnTimelineEntryProviders');
      });
    });

    describe('The get function', function() {
      it('should not return provider when no providers are registered', function() {
        expect(service.get('foo')).to.deep.equals([]);
      });
    });

    describe('The register function', function() {
      it('should not fail when provider is undefined', function() {
        expect(service.register).to.not.throw(Error);
      });

      it('should not fail when verb is undefined', function() {
        expect(service.register.bind({})).to.not.throw(Error);
      });
    });

    it('should be able to save and retrieve providers', function() {

      var providerA = {
        verb: 'like',
        canHandle: function() {
          return true;
        }
      };

      var providerB = {
        verb: 'post',
        canHandle: function() {
          return false;
        }
      };

      var providerC = {
        verb: 'post',
        canHandle: function() {
          return false;
        }
      };

      service.register(providerA);
      service.register(providerB);
      service.register(providerC);

      expect(service.get('like')).to.shallowDeepEqual([{verb: 'like'}]);
      expect(service.get('post')).to.shallowDeepEqual([{verb: 'post'}, {verb: 'post'}]);
    });
  });

  describe('The esnTimelineEntriesHelper factory', function() {

    var service, $rootScope, esnTimelineEntryProviders;

    beforeEach(inject(function(_$rootScope_, _esnTimelineEntriesHelper_, _esnTimelineEntryProviders_) {
      esnTimelineEntryProviders = _esnTimelineEntryProviders_;
      service = _esnTimelineEntriesHelper_;
      $rootScope = _$rootScope_;
    }));

    describe('The getProvidersForTimelineEntry function', function() {

      it('should return empty array when no provider can handle the entry', function() {
        var providers = service.getProvidersForTimelineEntry({verb: 'like'});
        expect(providers).to.shallowDeepEqual([]);
      });

      it('should return the providers which can handle the entry', function() {

        var providerA = {
          name: 'A',
          verb: 'like',
          canHandle: function() {
            return true;
          }
        };
        var providerB = {
          name: 'B',
          verb: 'like',
          canHandle: function() {
            return false;
          }
        };

        esnTimelineEntryProviders.register(providerA);
        esnTimelineEntryProviders.register(providerB);

        var providers = service.getProvidersForTimelineEntry({verb: 'like'});
        expect(providers).to.shallowDeepEqual([{verb: 'like', name: 'A'}]);
      });

    });

    describe('The denormalizeAPIResponse function', function() {
      it('should add the templateUrl from the provider to the entry', function(done) {
        var templateUrl = '/foo/bar';
        var providerA = {
          name: 'A',
          verb: 'like',
          templateUrl: templateUrl,
          canHandle: function() {
            return true;
          }
        };
        esnTimelineEntryProviders.register(providerA);

        function check(data) {
          expect(data).to.shallowDeepEqual([
            {
              templateUrl: templateUrl
            }
          ]);
          done();
        }
        service.denormalizeAPIResponse([{verb: 'like'}]).then(check, done);
        $rootScope.$digest();
      });

      it('should filter the entry if no provider is available', function(done) {
        service.denormalizeAPIResponse([{verb: 'like'}]).then(check, done);
        $rootScope.$digest();

        function check(data) {
          expect(data).to.shallowDeepEqual([]);
          done();
        }
      });
    });
  });

  describe('The TimelinePaginationProvider factory', function() {

    var esnTimelineAPI, $q, $rootScope, TimelinePaginationProvider;

    function generateData(size) {
      var result = [];
      for (var i = 0; i < size; i++) {
        result.push({verb: 'post', actor: {objectType: 'user', _id: 1}, object: {objectType: 'whatsup', _id: 2}});
      }
      return result;
    }

    beforeEach(function() {
      esnTimelineAPI = {};
      angular.mock.module('esn.timeline', function($provide) {
        $provide.value('esnTimelineAPI', esnTimelineAPI);
      });
    });

    beforeEach(inject(function(_$controller_, _$q_, _$rootScope_) {
      $q = _$q_;
      $rootScope = _$rootScope_;
    }));

    beforeEach(function() {
      inject(function($injector) {
        TimelinePaginationProvider = $injector.get('TimelinePaginationProvider');
      });
    });

    describe('The loadNextItems function', function() {
      it('should send back data and lastPage flag to false when end is not reached', function(done) {
        var size = 10;
        var options = {limit: size};
        esnTimelineAPI.getUserTimelineEntries = function() {
          return $q.when({data: generateData(size)});
        };

        var service = new TimelinePaginationProvider(options);
        service.loadNextItems().then(function(result) {
          expect(result.data.length).to.equal(size);
          expect(result.lastPage).to.be.false;
          done();
        }, done);
        $rootScope.$digest();
      });

      it('should send back data and lastPage flag to true when end is reached', function(done) {
        var size = 10;
        var options = {limit: size};
        esnTimelineAPI.getUserTimelineEntries = function() {
          return $q.when({data: generateData(size / 2)});
        };

        var service = new TimelinePaginationProvider(options);
        service.loadNextItems().then(function(result) {
          expect(result.data.length).to.equal(size / 2);
          expect(result.lastPage).to.be.true;
          done();
        }, done);
        $rootScope.$digest();
      });
    });
  });

  describe('The esnTimelineEntriesController controller', function() {
    var $controller, $scope, $q, $rootScope, PageAggregatorService, sessionMock, esnTimelineEntriesHelper;
    var timelineEntries = [
      {verb: 'post', actor: {objectType: 'user', _id: 1}, object: {objectType: 'whatsup', _id: 2}},
      {verb: 'like', actor: {objectType: 'user', _id: 1}, object: {objectType: 'whatsup', _id: 3}},
      {verb: 'foo', actor: {objectType: 'user', _id: 1}, object: {objectType: 'bar', _id: 4}}
    ];

    function initController() {
      $scope = {};
      $controller('esnTimelineEntriesController', {$scope: $scope});
      $rootScope.$digest();
    }

    beforeEach(function() {
      esnTimelineEntriesHelper = {};

      sessionMock = {
        user: {
          _id: 1
        }
      };

      PageAggregatorService = function() {};
      angular.mock.module('esn.timeline', function($provide) {
        $provide.value('session', sessionMock);
        $provide.value('esnTimelineEntriesHelper', esnTimelineEntriesHelper);
        $provide.value('PageAggregatorService', PageAggregatorService);
      });
    });

    beforeEach(inject(function(_$controller_, _$q_, _$rootScope_) {
      $controller = _$controller_;
      $q = _$q_;
      $rootScope = _$rootScope_;
    }));

    describe('The loadNext function', function() {

      it('should load data and update the timelineentries', function() {
        esnTimelineEntriesHelper.denormalizeAPIResponse = sinon.stub().returns($q.when(timelineEntries));
        PageAggregatorService.prototype.loadNextItems = sinon.stub().returns($q.when({data: timelineEntries}));

        initController();

        $scope.loadNext();
        $rootScope.$digest();
        expect($scope.timelineEntries).to.shallowDeepEqual(timelineEntries);
      });
    });
  });
});
