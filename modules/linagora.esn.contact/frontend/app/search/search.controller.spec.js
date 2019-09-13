'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The ContactSearchController controller', function() {
  var $controller,
    $scope,
    controller,
    contactSearchProviders,
    esnSearchQueryService,
    $q,
    $rootScope;

  function initController() {
    controller = $controller('ContactSearchController', { $scope: $scope });
    $scope.$digest();
  }

  beforeEach(function() {
    module('linagora.esn.contact');

    inject(function(
      _$controller_,
      _$q_,
      _$rootScope_,
      _esnSearchQueryService_,
      _contactSearchProviders_
    ) {
      $controller = _$controller_;
      $q = _$q_;
      esnSearchQueryService = _esnSearchQueryService_;
      contactSearchProviders = _contactSearchProviders_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
    });
  });

  describe('The loadMoreElements function', function() {
    it('should resolve when query is empty', function(done) {
      esnSearchQueryService.isEmpty = sinon.stub().returns(true);

      initController();

      controller
        .loadMoreElements()
        .then(function(result) {
          expect(esnSearchQueryService.isEmpty).to.be.calledOnce;
          expect(result).to.be.empty;
          done();
        })
        .catch(function(error) {
          done(error);
        });

      $scope.$digest();
    });

    it('should call contactSearchProvider with defined query', function(done) {
      var fetchSpy = sinon.stub().returns(function() {
        return $q.when();
      });

      esnSearchQueryService.isEmpty = function() {
        return false;
      };
      esnSearchQueryService.buildFromState = function() {
        return true;
      };
      var query = esnSearchQueryService.buildFromState();

      contactSearchProviders.get = function() {
        return {
          fetch: fetchSpy
        };
      };
      initController();

      controller
        .loadMoreElements()
        .then(function() {
          expect(fetchSpy).to.be.calledWith(query);
          done();
        })
        .catch(function(error) {
          done(error);
        });

      $scope.$digest();
    });
  });
});
