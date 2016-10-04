'use strict';

/* global chai: false */
/* global moment: false */
/* global sinon: false */
var expect = chai.expect;

describe('The esn.provider module', function() {

  var nowDate = new Date('2015-08-20T04:00:00Z'),
      localTimeZone = 'Europe/Paris',
      uuid4;

  beforeEach(function() {
    angular.mock.module('angularMoment');
    angular.mock.module('esn.provider');
  });

  beforeEach(module(function($provide) {
    $provide.value('localTimezone', 'UTC');
    $provide.constant('moment', function(argument) {
      return moment.tz(argument || nowDate, localTimeZone);
    });
    $provide.value('uuid4', uuid4 = {});
  }));

  describe('The Providers factory', function() {
    var $rootScope, providers, newProvider;

    beforeEach(inject(function(_$rootScope_, _Providers_, _newProvider_) {
      $rootScope = _$rootScope_;
      providers = new _Providers_();
      newProvider = _newProvider_;
    }));

    describe('The newProvider factory', function() {
      it('should generate an id with uuid4 for a provider without an id', function() {
        uuid4.generate = sinon.spy(function() { return '123'; });

        var provider = newProvider({ name: 'provider', type: 'type1' });

        expect(provider.id).to.equal('123');
        expect(uuid4.generate).to.have.been.calledWith;
      });

      it('should not generate any id for a provider with existing id', function() {
        uuid4.generate = sinon.spy();

        var provider = newProvider({ name: 'provider', type: 'type1', id: '456' });

        expect(provider.id).to.equal('456');
        expect(uuid4.generate).to.not.have.been.called;
      });
    });

    describe('The getAllProviderDefinitions function', function() {

      it('should return an array containing names and ids of added providers', function() {
        var spy = sinon.spy();

        providers.add($q.when({ id: 1, name: 'provider1', property: 'value' }));
        providers.add({ id: 2, name: 'provider2', another: 'value2' });

        providers.getAllProviderDefinitions().then(spy);
        $rootScope.$digest();

        expect(spy).to.have.been.calledWith([
          { id: 1, name: 'provider1' },
          { id: 2, name: 'provider2' }
        ]);
      });

    });

    describe('The getAll function', function() {

      it('should return all providers when no acceptedTypes is given', function() {
        providers.add({ name: 'provider', type: 'type1',
          buildFetchContext: sinon.stub().returns($q.when()),
          fetch: sinon.stub().returns($q.when())
        });
        providers.add($q.when({ name: 'provider2', type: 'type2',
          buildFetchContext: sinon.stub().returns($q.when()),
          fetch: sinon.stub().returns($q.when())
        }));

        providers.getAll({}).then(function(resolvedProviders) {
          expect(resolvedProviders).to.shallowDeepEqual([
            { name: 'provider', type: 'type1'},
            { name: 'provider2', type: 'type2'}
          ]);
        });

        $rootScope.$digest();
      });

      it('should filter providers that are not in the acceptedTypes array', function() {
        providers.add({ name: 'provider', type: 'type1',
          buildFetchContext: sinon.stub().returns($q.when()),
          fetch: sinon.stub().returns($q.when())
        });
        providers.add({ name: 'provider2', type: 'type2',
          buildFetchContext: sinon.stub().returns($q.when()),
          fetch: sinon.stub().returns($q.when())
        });

        providers.getAll({acceptedTypes: ['type1']}).then(function(resolvedProviders) {
          expect(resolvedProviders).to.shallowDeepEqual([{ name: 'provider', type: 'type1'}]);
        });

        $rootScope.$digest();
      });

      it('should filter providers that are not in the acceptedIds array', function() {
        providers.add({ name: 'provider', type: 'type1', id: '123',
          buildFetchContext: sinon.stub().returns($q.when()),
          fetch: sinon.stub().returns($q.when())
        });
        providers.add({ name: 'provider2', type: 'type2', id: '456',
          buildFetchContext: sinon.stub().returns($q.when()),
          fetch: sinon.stub().returns($q.when())
        });

        providers.getAll({acceptedIds: ['456']}).then(function(resolvedProviders) {
          expect(resolvedProviders).to.shallowDeepEqual([{ name: 'provider2', type: 'type2', id: '456'}]);
        });

        $rootScope.$digest();
      });

      it('should build the fetch context of each provider using its own buildFetchContext function', function() {
        var getAllOptions = {expected: 'options'},
            provider1 = { name: 'provider', type: 'type1',
              buildFetchContext: sinon.stub().returns($q.when('context1')),
              fetch: sinon.stub().returns($q.when())
            },
            provider2 = { name: 'provider2', type: 'type2',
              buildFetchContext: sinon.stub().returns($q.when('context2')),
              fetch: sinon.stub().returns($q.when())
            };

        providers.add(provider1);
        providers.add(provider2);

        providers.getAll(getAllOptions).then(function(resolvedProviders) {
          expect(provider1.buildFetchContext).to.have.been.calledWith(getAllOptions);
          expect(provider2.buildFetchContext).to.have.been.calledWith(getAllOptions);

          expect(provider1.fetch).to.have.been.calledWith('context1');
          expect(provider2.fetch).to.have.been.calledWith('context2');
        });

        $rootScope.$digest();
      });

    });

  });

  describe('The ByTypeElementGroupingTool factory', function() {
    var ByTypeElementGroupingTool;

    beforeEach(inject(function(_ByTypeElementGroupingTool_) {
      ByTypeElementGroupingTool = _ByTypeElementGroupingTool_;
    }));

    it('should build an array of empty types group objects', function() {
      var elementGroupingTool = new ByTypeElementGroupingTool([
        'Events',
        'Contacts',
        'Emails'
      ]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal([
        {name: 'Events', elements: []},
        {name: 'Contacts', elements: []},
        {name: 'Emails', elements: []}
      ]);
    });

    it('should push a received element into the correct type group', function() {
      var elementGroupingTool = new ByTypeElementGroupingTool([
        'Events',
        'Contacts',
        'Emails'
      ], [
        {type: 'Events', title: 'anEvent'},
        {type: 'Emails', email: 'anEmail'},
        {type: 'Events', title: 'anEvent2'},
        {type: 'Contacts', name: 'aContact'},
        {type: 'Contacts', name: 'aContact2'}
      ]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal([
        {name: 'Events', elements: [
          {type: 'Events', title: 'anEvent'},
          {type: 'Events', title: 'anEvent2'}
        ]},
        {name: 'Contacts', elements: [
          {type: 'Contacts', name: 'aContact'},
          {type: 'Contacts', name: 'aContact2'}
        ]},
        {name: 'Emails', elements: [
          {type: 'Emails', email: 'anEmail'}
        ]}
      ]);
    });

  });

  describe('The ByDateElementGroupingTool factory', function() {

    var ByDateElementGroupingTool;

    function groups(todayElement, yesterdayElement, weekElement, monthElement, olderElement) {
      return [
        {name: 'Today', dateFormat: 'shortTime', elements: todayElement ? [todayElement] : []},
        {name: 'Yesterday', dateFormat: 'shortTime', elements: yesterdayElement ? [yesterdayElement] : []},
        {name: 'This Week', dateFormat: 'EEE d', elements: weekElement ? [weekElement] : []},
        {name: 'This Month', dateFormat: 'EEE d', elements: monthElement ? [monthElement] : []},
        {name: 'Older than a month', dateFormat: 'mediumDate', elements: olderElement ? [olderElement] : []}
      ];
    }

    beforeEach(inject(function(_ByDateElementGroupingTool_) {
      ByDateElementGroupingTool = _ByDateElementGroupingTool_;
    }));

    it('should build an array of empty groups when no elements are added', function() {
      var elementGroupingTool = new ByDateElementGroupingTool();

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal(groups());
    });

    it('should put a received element in the today group if it has the now date', function() {
      var element = { date: nowDate },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal(groups(element));
    });

    it('should put a received element in the today group if it has the midnight date', function() {
      var element = { date: '2015-08-20T00:10:00Z' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal(groups(element));
    });

    it('should put a received element in the today group even if it has a future date', function() {
      var element = { date: '2015-08-21T00:10:00Z' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal(groups(element));
    });

    it('should put a received element in the yesterday group if it is 1 day old', function() {
      var element = { date: '2015-08-19T20:00:00Z' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal(groups(null, element));
    });

    it('should put a received element in the week group if it is 2 days old, but in the same week', function() {
      var element = { date: '2015-08-18T04:00:00Z' },
        elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal(groups(null, null, element));
    });

    it('should put a received element in the week group if it is 4 days old, but in the same week', function() {
      var element = { date: '2015-08-16T04:00:00Z' },
        elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal(groups(null, null, element));
    });

    it('should put a received element in the week group if it is 7 days old, in the previous week', function() {
      var element = { date: '2015-08-13T04:00:00Z' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal(groups(null, null, null, element));
    });

    it('should put a received element in the month group if it is just older than one week', function() {
      var element = { date: '2015-08-12T22:00:00Z' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal(groups(null, null, null, element));
    });

    it('should put a received element in the week group if it is just newer than one week with both +7 TZ', function() {
      localTimeZone = 'Asia/Ho_Chi_Minh';

      var element = { date: '2015-08-16T08:00:00+07:00' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal(groups(null, null, element));
    });

    it('should put a received element in the week group if it is just newer than one week when element +7 TZ', function() {
      localTimeZone = 'UTC';

      var element = { date: '2015-08-16T08:00:00+07:00' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal(groups(null, null, element));
    });

    it('should put a received element in the week group if it is just newer than one week when now +7 TZ', function() {
      localTimeZone = 'Asia/Ho_Chi_Minh';
      nowDate = new Date('2015-08-21T05:00:00+07:00');

      var element = { date: '2015-08-16T01:00:00+00:00' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal(groups(null, null, element));
    });

    it('should put a received element in the month group if it is just older than one week with both +7 TZ', function() {
      localTimeZone = 'Asia/Ho_Chi_Minh';

      var element = { date: '2015-08-15T23:00:00+07:00' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal(groups(null, null, null, element));
    });

    it('should put a received element in the month group if it is just older than one week when element +7 TZ', function() {
      localTimeZone = 'UTC';
      var element = { date: '2015-08-15T05:00:00+07:00' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal(groups(null, null, null, element));
    });

    it('should put a received element in the month group if it is just older than one week when now +7 TZ', function() {
      localTimeZone = 'Asia/Ho_Chi_Minh';
      var element = { date: '2015-08-15T22:00:00+00:00' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal(groups(null, null, null, element));
    });

    it('should put a received element in the month group if it is just older than one week with both -7 TZ', function() {
      localTimeZone = 'America/Los_Angeles';
      var element = { date: '2015-08-15T15:00:00-07:00' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal(groups(null, null, null, element));
    });

    it('should put a received element in the month group if it is just older than one week when element -7 TZ', function() {
      localTimeZone = 'UTC';
      var element = { date: '2015-08-15T15:00:00-07:00' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal(groups(null, null, null, element));
    });

    it('should put a received element in the month group if it is just older than one week when now -7 TZ', function() {
      localTimeZone = 'America/Los_Angeles';
      var element = { date: '2015-08-15T22:00:00+00:00' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal(groups(null, null, null, element));
    });

    it('should put a received element in the month group if its date is the first of the month', function() {
      var element = { date: '2015-08-01T04:00:00Z' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal(groups(null, null, null, element));
    });

    it('should put a received element in the older group if its date is the last day of the previous month', function() {
      var element = { date: '2015-07-31T04:00:00Z' },
        elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal(groups(null, null, null, null, element));
    });

    describe('The removeElement method', function() {

      it('should remove the element from group', function() {
        var element1 = { date: '2015-05-31T04:00:00Z' },
            element2 = { date: '2015-07-31T04:00:00Z' },
            elementGroupingTool = new ByDateElementGroupingTool([element1, element2]);

        elementGroupingTool.removeElement(element2);

        expect(elementGroupingTool.getGroupedElements()).to.deep.equal(groups(null, null, null, null, element1));
      });

    });

    describe('The removeElements method', function() {

      it('should remove all elements from group', function() {
        var element1 = { date: '2015-05-31T04:00:00Z' },
            element2 = { date: '2015-07-31T04:00:00Z' },
            elementGroupingTool = new ByDateElementGroupingTool([element1, element2]);

        elementGroupingTool.removeElements([element2, element1]);

        expect(elementGroupingTool.getGroupedElements()).to.deep.equal(groups(null, null, null, null, null));
      });

    });

  });

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

  describe('infiniteScrollHelper', function() {
    var ELEMENTS_PER_PAGE, INFINITE_LIST_EVENTS, $timeout, infiniteScrollHelper, $q, $rootScope;

    beforeEach(function() {
      ELEMENTS_PER_PAGE = 3;
      angular.mock.module(function($provide) {
        $provide.constant('ELEMENTS_PER_PAGE', ELEMENTS_PER_PAGE);
      });
    });

    beforeEach(inject(function(_infiniteScrollHelper_, _$q_, _$rootScope_, _$timeout_, _INFINITE_LIST_EVENTS_) {
      infiniteScrollHelper = _infiniteScrollHelper_;
      $q = _$q_;
      $rootScope = _$rootScope_;
      $timeout = _$timeout_;
      INFINITE_LIST_EVENTS = _INFINITE_LIST_EVENTS_;
    }));

    describe('The return iterator', function() {
      var sourceIterator, resultingIterator, scope;

      beforeEach(function() {
        scope = $rootScope.$new();
        sourceIterator = sinon.stub();

        sourceIterator.onCall(0).returns($q.when([1, 2, 3]))
          .onCall(1).returns($q.when([4, 5, 6]))
          .onCall(2).returns($q.when([7, 8]))
          .onCall(3).returns($q.when([]));

        resultingIterator = infiniteScrollHelper(scope, sourceIterator);
      });

      it('should correctly iterate over given iterator', function() {
        var thenSpy = sinon.spy();

        iteratorToList(resultingIterator).then(thenSpy);
        $rootScope.$digest();
        expect(thenSpy).to.have.been.calledWith([[1, 2, 3], [4, 5, 6], [7, 8]]);
        expect(scope.elements).to.deep.equals([1, 2, 3, 4, 5, 6, 7, 8]);
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

  });

  describe('infiniteScrollOnGroupsHelper', function() {
    var ELEMENTS_PER_PAGE, INFINITE_LIST_EVENTS, infiniteScrollOnGroupsHelper, $timeout, $q, $rootScope, elementGroupingTool;

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
});
