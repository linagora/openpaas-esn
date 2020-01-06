'use strict';

/* global chai, sinon: false */
var expect = chai.expect;

describe('The infiniteScrollHelper module', function() {
  var $q, $timeout, $rootScope;
  var infiniteScrollHelper;
  var dbMock;
  var ELEMENTS_PER_PAGE, INFINITE_LIST_EVENTS;

  function iteratorToList(iterator, betweenEachStep) {
    return $q(function(resolve) {
      var result = [];

      function step() {
        iterator().then(function(data) {
          result.push(data);
          betweenEachStep && betweenEachStep();

          return step();
        }, function() {
          resolve(result);
        });
      }

      step();
    });
  }

  beforeEach(function() {
    angular.mock.module('esn.provider');
    angular.mock.module(function($provide) {
      $provide.constant('ELEMENTS_PER_PAGE', ELEMENTS_PER_PAGE);
    });

    ELEMENTS_PER_PAGE = 3;
    dbMock = [1, 2, 3, 4, 5, 6, 7];

    inject(function(
      _$q_,
      _$rootScope_,
      _$timeout_,
      _infiniteScrollHelper_,
      _INFINITE_LIST_EVENTS_
    ) {
      $q = _$q_;
      $rootScope = _$rootScope_;
      $timeout = _$timeout_;
      infiniteScrollHelper = _infiniteScrollHelper_;
      INFINITE_LIST_EVENTS = _INFINITE_LIST_EVENTS_;
    });
  });

  describe('The result of infiniteScrollHelper function if element_per_page is set to default', function() {
    var resultingIterator, scope, updateScope, elementsPerPage;
    var sourceIterator;

    beforeEach(function() {
      scope = $rootScope.$new();
      sourceIterator = sinon.stub();
      updateScope = null;
      elementsPerPage = undefined;

      sourceIterator.onCall(0).returns($q.when([1, 2, 3]))
        .onCall(1).returns($q.when([4, 5, 6]))
        .onCall(2).returns($q.when([7]))
        .onCall(3).returns($q.when([]));

      resultingIterator = infiniteScrollHelper(scope, sourceIterator, updateScope, elementsPerPage);
    });

    it('should correctly iterate over given iterator', function() {
      var thenSpy = sinon.spy();

      iteratorToList(resultingIterator).then(thenSpy);
      $rootScope.$digest();
      expect(thenSpy).to.have.been.calledWith([[1, 2, 3], [4, 5, 6], [7]]);
      expect(scope.elements).to.deep.equals(dbMock);
    });

    it('should set infiniteScrollCompleted when given iterator return less elements than ELEMENTS_PER_PAGE', function() {
      var infiniteScrollCompletedTracker = [];

      iteratorToList(resultingIterator, function() {
        infiniteScrollCompletedTracker.push(scope.infiniteScrollCompleted);
      });
      $rootScope.$digest();
      expect(infiniteScrollCompletedTracker).to.be.deep.equal([undefined, undefined, true]);
    });

    it('should disable scroll while first iterator is fetching data', function() {
      resultingIterator();
      expect(scope.infiniteScrollDisabled).to.be.true;
      $rootScope.$digest();
      expect(scope.infiniteScrollDisabled).to.be.false;
    });

    it('should complete the infinite scroll and reject if there is an error fetching more data', function(done) {
      infiniteScrollHelper(scope, function() {
        return $q.reject();
      })().then(null, function() {
        expect(scope.infiniteScrollCompleted).to.equal(true);

        done();
      });
      $rootScope.$digest();
    });

    it('should $emit INFINITE_LIST_EVENTS.LOAD_MORE_ELEMENTS when it fetches some data', function() {
      var spy = sinon.spy();

      scope.$on(INFINITE_LIST_EVENTS.LOAD_MORE_ELEMENTS, spy);

      resultingIterator();
      $rootScope.$digest();
      resultingIterator();
      $rootScope.$digest();
      $timeout.flush();

      expect(spy).to.have.been.calledTwice;
    });
  });

  describe('The result of infiniteScrollHelper function if element_per_page is set custom value', function() {
    var resultingIterator, scope, updateScope, elementsPerPage;
    var sourceIterator;

    beforeEach(function() {
      scope = $rootScope.$new();
      sourceIterator = sinon.stub();
      updateScope = null;
      elementsPerPage = 2;

      sourceIterator.onCall(0).returns($q.when([1, 2]))
        .onCall(1).returns($q.when([3, 4]))
        .onCall(2).returns($q.when([5, 6]))
        .onCall(3).returns($q.when([7]))
        .onCall(4).returns($q.when([]));

      resultingIterator = infiniteScrollHelper(scope, sourceIterator, updateScope, elementsPerPage);
    });

    it('should correctly iterate over given iterator', function() {
      var thenSpy = sinon.spy();

      iteratorToList(resultingIterator).then(thenSpy);
      $rootScope.$digest();
      expect(thenSpy).to.have.been.calledWith([[1, 2], [3, 4], [5, 6], [7]]);
      expect(scope.elements).to.deep.equals(dbMock);
    });
  });
});
