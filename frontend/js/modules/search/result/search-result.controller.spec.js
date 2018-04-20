'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The searchResultController controller', function() {
  var $controller, $scope, controller, $stateParams, $q, query, searchProviders, $rootScope, ELEMENTS_PER_PAGE;

  beforeEach(function() {
    angular.mock.module('esn.search');
  });

  function initController() {
    controller = $controller('searchResultController', { $scope: $scope }, {});
    $scope.$digest();
    controller.$onInit();
  }

  function buildIterator(list) {
    var i = 0;

    return function() {
      return $q.when({data: list[i++]});
    };
  }

  function callLoadMoreElements(iterations) {
    for (var i = 0; i < iterations; i++) {
      controller.loadMoreElements();
      $rootScope.$digest();
    }
  }

  beforeEach(function() {
    query = { text: 'query' };
    searchProviders = {
      getAll: sinon.spy(function() {
        return $q.when([{
          name: 'cat',
          loadNextItems: buildIterator([
            [{name: 'cat1', date: new Date(2016, 4, 1)}, {name: 'cat2', date: new Date(2016, 3, 1)}],
            [{name: 'cat3', date: new Date(2016, 2, 1)}, {name: 'cat4', date: new Date(2016, 1, 1)}]])
        }, {
          name: 'dog',
          loadNextItems: buildIterator([
            [{name: 'dog1', date: new Date(2016, 4, 2)}, {name: 'dog2', date: new Date(2016, 3, 2)}],
            [{name: 'dog3', date: new Date(2016, 2, 2)}, {name: 'dog4', date: new Date(2016, 1, 2)}]])
        }]);
      })
    };

    $stateParams = { query: query };
    angular.mock.module('esn.search', function($provide) {
      $provide.value('$stateParams', $stateParams);
      $provide.value('searchProviders', searchProviders);
      $provide.constant('AGGREGATOR_DEFAULT_FIRST_PAGE_SIZE', 2);
      $provide.constant('ELEMENTS_PER_PAGE', ELEMENTS_PER_PAGE = 2);
    });
  });

  beforeEach(inject(function(_$controller_, _$q_, _$rootScope_) {
    $controller = _$controller_;
    $q = _$q_;
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    initController();
  }));

  it('should init query for highlight', function() {
    expect(controller.query).to.deep.equal(query.text);
  });

  it('should not call loadMoreElements when query is falsy', function() {
    controller.query = null;
    controller.loadMoreElements();

    expect(searchProviders.getAll).to.not.have.been.called;
  });

  it('should call searchProviders with the correct arguments when loadMoreElements is called', function() {
    controller.loadMoreElements();

    expect(searchProviders.getAll).to.have.been.calledWith({ query: query.text });
  });

  it('should map filters and call searchProviders with acceptedIds when providers are present in stateParams', function() {
    $stateParams.providers = [{ id: '123' }, { id: '456' }, { id: '789' }];
    initController();

    controller.loadMoreElements();

    expect(searchProviders.getAll).to.have.been.calledWith({ query: query.text, acceptedIds: ['123', '456', '789'] });
  });

  describe('controller elements', function() {

    it('should contain as many elements "ordered by date" as specified in ELEMENTS_PER_PAGE after the first loadMoreElements()', function() {
      callLoadMoreElements(1);

      expect(controller.elements.length).to.equal(ELEMENTS_PER_PAGE);
      expect(controller.elements).to.shallowDeepEqual([{name: 'dog1'}, {name: 'cat1'}]);
    });

    it('should be pushed by ELEMENTS_PER_PAGE elements after each loadMoreElements() and always respect the order by date', function() {
      var iterations = 3;

      callLoadMoreElements(iterations);

      expect(controller.elements.length).to.equal(ELEMENTS_PER_PAGE * iterations);
      expect(controller.elements).to.shallowDeepEqual(
        [{name: 'dog1'}, {name: 'cat1'}, {name: 'dog2'}, {name: 'cat2'}, {name: 'dog3'}, {name: 'cat3'}]
      );
    });
  });
});
