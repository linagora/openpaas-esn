'use strict';

/* global chai, moment, sinon: false */
var expect = chai.expect;

describe('The infiniteScrollOnGroupsHelper service', function() {

  var nowDate = new Date('2015-08-20T04:00:00Z'), localTimeZone = 'Europe/Paris';
  var ELEMENTS_PER_PAGE, INFINITE_LIST_EVENTS, infiniteScrollOnGroupsHelper, $timeout, $q, $rootScope, elementGroupingTool;

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
    angular.mock.module('angularMoment');
    angular.mock.module('esn.provider');
  });

  beforeEach(module(function($provide) {
    $provide.value('localTimezone', 'UTC');
    $provide.constant('moment', function(argument) {
      return moment.tz(argument || nowDate, localTimeZone);
    });
  }));

  beforeEach(function() {
    elementGroupingTool = {
      getGroupedElements: angular.noop,
      addElement: sinon.spy(),
      addAll: sinon.spy(),
      removeElement: sinon.spy(),
      removeElements: sinon.spy(),
      reset: sinon.spy()
    };
    ELEMENTS_PER_PAGE = 3;
    angular.mock.module(function($provide) {
      $provide.constant('ELEMENTS_PER_PAGE', ELEMENTS_PER_PAGE);
    });
  });

  beforeEach(inject(function(_infiniteScrollOnGroupsHelper_, _$q_, _$rootScope_, _$timeout_, _INFINITE_LIST_EVENTS_) {
    infiniteScrollOnGroupsHelper = _infiniteScrollOnGroupsHelper_;
    $q = _$q_;
    $rootScope = _$rootScope_;
    $timeout = _$timeout_;
    INFINITE_LIST_EVENTS = _INFINITE_LIST_EVENTS_;
  }));

  it('should call groups.addElement when ADD_ELEMENTS is received', function() {
    var scope = $rootScope.$new(), item = { id: 'item' };

    infiniteScrollOnGroupsHelper(scope, null, elementGroupingTool);
    scope.$emit(INFINITE_LIST_EVENTS.ADD_ELEMENTS, [item]);

    expect(scope.groups.addAll).to.have.been.calledWith([item]);
  });

  it('should call groups.removeElement when REMOVE_ELEMENTS is received', function(done) {
    var scope = $rootScope.$new(), item = { id: 'item' };

    infiniteScrollOnGroupsHelper(scope, null, elementGroupingTool);
    scope.$on(INFINITE_LIST_EVENTS.LOAD_MORE_ELEMENTS, done.bind(null, null));
    scope.$emit(INFINITE_LIST_EVENTS.REMOVE_ELEMENTS, [item]);

    expect(scope.groups.removeElements).to.have.been.calledWith([item]);

    $timeout.flush();
  });

  describe('The destroy function', function() {

    it('should reset the groups', function() {
      var scope = $rootScope.$new(),
          helper = infiniteScrollOnGroupsHelper(scope, null, elementGroupingTool);

      helper.destroy();

      expect(scope.groups.reset).to.have.been.calledWith();
    });

    it('should unregister the ADD_ELEMENTS listener', function() {
      var scope = $rootScope.$new(),
          item = { a: 'b' },
          helper = infiniteScrollOnGroupsHelper(scope, null, elementGroupingTool);

      helper.destroy();
      scope.$emit(INFINITE_LIST_EVENTS.ADD_ELEMENTS, item);

      expect(scope.groups.addAll).to.have.not.been.calledWith();
    });

    it('should unregister the REMOVE_ELEMENTS listener', function() {
      var scope = $rootScope.$new(),
          item = { a: 'b' },
          helper = infiniteScrollOnGroupsHelper(scope, null, elementGroupingTool);

      helper.destroy();
      scope.$emit(INFINITE_LIST_EVENTS.REMOVE_ELEMENTS, item);

      expect(scope.groups.removeElements).to.have.not.been.calledWith();
    });

  });

  describe('The return iterator', function() {
    var sourceIterator, resultingIterator, scope, elementGroupingTool, getGroupedElementsResult;

    beforeEach(function() {
      scope = $rootScope.$new();
      sourceIterator = sinon.stub();
      getGroupedElementsResult = {};

      sourceIterator.onCall(0).returns($q.when([1, 2, 3]))
        .onCall(1).returns($q.when([4, 5, 6]))
        .onCall(2).returns($q.when([7, 8]))
        .onCall(3).returns($q.when([]));

      elementGroupingTool = {
        getGroupedElements: sinon.stub().returns(getGroupedElementsResult),
        addAll: sinon.spy()
      };

      resultingIterator = infiniteScrollOnGroupsHelper(scope, sourceIterator, elementGroupingTool);
    });

    it('should correctly iterate over given iterator', function() {
      var thenSpy = sinon.spy();

      iteratorToList(resultingIterator).then(thenSpy);
      $rootScope.$digest();

      expect(thenSpy).to.have.been.calledWith([[1, 2, 3], [4, 5, 6], [7, 8]]);
      expect(elementGroupingTool.addAll).to.have.been.calledWith([1, 2, 3]);
      expect(elementGroupingTool.addAll).to.have.been.calledWith([4, 5, 6]);
      expect(elementGroupingTool.addAll).to.have.been.calledWith([7, 8]);
      expect(scope.groupedElements).to.equals(getGroupedElementsResult);
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
  });
});
