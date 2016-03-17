'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The Unified Inbox Angular module providers', function() {

  var jmapClient;

  beforeEach(function() {
    angular.mock.module('esn.configuration');
    angular.mock.module('linagora.esn.unifiedinbox', function($provide) {
      jmapClient = {
        getMailboxWithRole: function(role) {
          return $q.when({ id: 'id_' + role.value });
        },
        getMessageList: function(options) {
          expect(options.filter.inMailboxes).to.deep.equal(['id_inbox']);

          return $q.when({
            getMessages: function() { return $q.when([]); }
          });
        }
      };

      $provide.value('withJmapClient', function(cb) {
        return cb(jmapClient);
      });
    });
  });

  describe('The inboxProviders factory', function() {

    var $rootScope, inboxProviders;

    beforeEach(angular.mock.inject(function(_$rootScope_, _inboxProviders_) {
      $rootScope = _$rootScope_;
      inboxProviders = _inboxProviders_;
    }));

    describe('The getAll function', function() {

      it('should return an array of providers, with the "fetcher" property initialized', function(done) {
        inboxProviders.add({
          getDefaultContainer: sinon.spy(function() { return $q.when('container'); }),
          fetch: sinon.spy(function(container) {
            expect(container).to.equal('container');

            return function() {
              return $q.when([]);
            };
          }),
          templateUrl: 'templateUrl'
        });
        inboxProviders.add({
          getDefaultContainer: sinon.spy(function() { return $q.when('container_2'); }),
          fetch: sinon.spy(function(container) {
            expect(container).to.equal('container_2');

            return function() {
              return $q.when([]);
            };
          }),
          templateUrl: 'templateUrl'
        });

        inboxProviders.getAll().then(function(providers) {
          $q.all(providers.map(function(provider) {
            return provider.fetcher();
          })).then(function(results) {
            results.forEach(function(result) {
              expect(result).to.deep.equal([]);
            });

            done();
          });
        });
        $rootScope.$digest();
      });

    });

  });

  describe('The inMemoryPaging factory', function() {

    var $rootScope, inMemoryPaging, ELEMENTS_PER_REQUEST;

    beforeEach(angular.mock.inject(function(_$rootScope_, _inMemoryPaging_, _ELEMENTS_PER_REQUEST_) {
      $rootScope = _$rootScope_;
      inMemoryPaging = _inMemoryPaging_;
      ELEMENTS_PER_REQUEST = _ELEMENTS_PER_REQUEST_;
    }));

    function loader(offset, length) {
      return sinon.spy(function(_offset, _limit) {
        expect(_limit).to.equal(ELEMENTS_PER_REQUEST);

        var results = [];
        for (var i = 0; i < length; i++) {
          results.push(_offset + i);
        }

        return $q.when(results);
      });
    }

    it('should invoke the loader to init the cache on first call', function(done) {
      var loadMoreElements = loader(0, 10);

      inMemoryPaging(loadMoreElements)(0, 10).then(function() {
        expect(loadMoreElements).to.have.been.calledOnce;

        done();
      });
      $rootScope.$digest();
    });

    it('should return a slice of the results, honoring offset and index', function(done) {
      var loadMoreElements = loader(0, 10);

      inMemoryPaging(loadMoreElements)(0, 3).then(function(results) {
        expect(results).to.deep.equal([0, 1, 2]);

        done();
      });
      $rootScope.$digest();
    });

    it('should page data in memory, if there is more data available in the cache', function(done) {
      var loadMoreElements = loader(0, 10), pager = inMemoryPaging(loadMoreElements);

      pager(0, 3).then(function() {
        pager(3, 2).then(function(results) {
          expect(loadMoreElements).to.have.been.calledOnce;
          expect(results).to.deep.equal([3, 4]);

          done();
        });
      });
      $rootScope.$digest();
    });

    it('should return empty results if there is no _more_ data available', function(done) {
      var loadMoreElements = loader(0, 10), pager = inMemoryPaging(loadMoreElements);

      pager(0, 10).then(function() {
        pager(10, 2).then(function(results) {
          expect(loadMoreElements).to.have.been.calledOnce;
          expect(results).to.deep.equal([]);

          done();
        });
      });
      $rootScope.$digest();
    });

    it('should return empty results if there is no data available', function(done) {
      var loadMoreElements = loader(0, 10);

      inMemoryPaging(loadMoreElements)(10, 10).then(function(results) {
        expect(loadMoreElements).to.have.been.calledOnce;
        expect(results).to.deep.equal([]);

        done();
      });
      $rootScope.$digest();
    });

    it('should fetch data again, paging correctly if there is more data available', function(done) {
      var loadMoreElements = loader(0, ELEMENTS_PER_REQUEST), pager = inMemoryPaging(loadMoreElements);

      pager(0, 200).then(function() {
        pager(200, 5).then(function(results) {
          expect(loadMoreElements).to.have.been.calledTwice;
          expect(results).to.deep.equal([200, 201, 202, 203, 204]);

          done();
        });
      });
      $rootScope.$digest();
    });

  });

});
