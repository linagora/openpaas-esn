'use strict';

/* global expect, sinon: false */

describe('The esnPaginationtionProviderBuilder factory', function() {
  var esnPaginationtionProviderBuilder, $rootScope, $q, esnPaginationProviderMock, PageAggregatorServiceMock;
  var loadNextSpy, name, scope, result, paginable;

  beforeEach(function() {
    angular.mock.module('esn.pagination');
    angular.mock.module('esn.infinite-list');
    angular.mock.module('esn.lodash-wrapper');
  });

  beforeEach(function() {
    paginable = sinon.spy(function() {
      return $q.when({data: result});
    });
    result = [1, 2, 3];
    name = 'My provider';
    scope = {};
    loadNextSpy = sinon.spy(function() {
      return $q.when({data: result});
    });
    esnPaginationProviderMock = function() {};
    PageAggregatorServiceMock = sinon.spy();
    PageAggregatorServiceMock.prototype.loadNextItems = loadNextSpy;

    module('esn.pagination', function($provide) {
      $provide.value('esnPaginationProvider', esnPaginationProviderMock);
      $provide.value('PageAggregatorService', PageAggregatorServiceMock);
      $provide.constant('ELEMENTS_PER_PAGE', 1);
    });
  });

  beforeEach(inject(function(_$q_, _$rootScope_, _esnPaginationtionProviderBuilder_) {
    $rootScope = _$rootScope_;
    $q = _$q_;
    esnPaginationtionProviderBuilder = _esnPaginationtionProviderBuilder_;
  }));

  it('should fill the scope with a loadMoreElements function', function() {
    var scope = {};

    esnPaginationtionProviderBuilder(scope, name, paginable, {});

    expect(scope.loadMoreElements).to.be.a.function;
  });

  it('should instanciate PageAggregatorService with good parameters', function() {
    var limit = 10;
    var compare = sinon.spy();

    esnPaginationtionProviderBuilder(scope, name, paginable, {
      compare: compare,
      limit: limit
    });

    scope.loadMoreElements();
    $rootScope.$digest();

    expect(PageAggregatorServiceMock).to.have.been.calledWith(name, [{}], {
      compare: compare,
      results_per_page: limit
    });

  });

  it('should call aggregator.loadNextItems when calling scope.loadMoreElements', function() {
    var thenSpy = sinon.spy();

    esnPaginationtionProviderBuilder(scope, name, paginable, {});

    scope.loadMoreElements().then(thenSpy);
    $rootScope.$digest();

    expect(loadNextSpy).to.have.been.calledOnce;
    expect(thenSpy).to.have.been.calledWith(result);
    expect(scope.elements).to.deep.equal(result);
  });

  it('should instanciate PageAggregatorService once', function() {
    var thenSpy = sinon.spy();

    esnPaginationtionProviderBuilder(scope, name, paginable, {});

    scope.loadMoreElements().then(thenSpy);
    $rootScope.$digest();
    scope.loadMoreElements().then(thenSpy);
    $rootScope.$digest();

    expect(loadNextSpy).to.have.been.calledTwice;
    expect(thenSpy).to.have.been.calledTwice;
    expect(PageAggregatorServiceMock).to.have.been.calledOnce;
  });
});
