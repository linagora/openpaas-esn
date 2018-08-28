'use strict';

/* global chai, moment, sinon, _: false */
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
    $provide.value('uuid4', uuid4 = {
      generate: sinon.spy()
    });
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
        var provider = newProvider({ name: 'provider', type: 'type1', id: '456' });

        expect(provider.id).to.equal('456');
        expect(uuid4.generate).to.not.have.been.called;
      });

      it('should create types array when not present', function() {
        expect(newProvider({ type: 'type1' }).types).to.deep.equal(['type1']);
      });

      it('should use types array when present', function() {
        expect(newProvider({ types: ['type1', 'type2'] }).types).to.deep.equal(['type1', 'type2']);
      });

      it('should derive type from types array when not present', function() {
        expect(newProvider({ types: ['type2', 'type1'] }).type).to.equal('type2');
      });

      it('should use type when present', function() {
        expect(newProvider({ type: 'type1' }).type).to.equal('type1');
      });

      it('should return the provider\'s main fetcher', function() {
        var fetcher = function() {},
            provider = newProvider({ id: 'id', fetch: fetcher });

        expect(provider.fetch).to.be.a('function');
      });

      it('should use account when present', function() {
        expect(newProvider({ account: 'myAccount' }).account).to.equal('myAccount');
      });

      it('should use itemMatches when present', function() {
        var itemMatches = function() {};

        expect(newProvider({ itemMatches: itemMatches }).itemMatches).to.equal(itemMatches);
      });

    });

    describe('The getAllProviderDefinitions function', function() {

      it('should return an array containing names, ids and uids of added providers', function() {
        var spy = sinon.spy();

        providers.add($q.when({ id: 1, name: 'provider1', uid: 'uid1', property: 'value' }));
        providers.add({ id: 2, name: 'provider2', uid: 'uid2', another: 'value2' });

        providers.getAllProviderDefinitions().then(spy);
        $rootScope.$digest();

        expect(spy).to.have.been.calledWith([
          { id: 1, name: 'provider1', uid: 'uid1' },
          { id: 2, name: 'provider2', uid: 'uid2' }
        ]);
      });

    });

    describe('The getAll function', function() {

      it('should return all providers when no acceptedTypes is given', function(done) {
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

          done();
        });

        $rootScope.$digest();
      });

      it('should filter providers that are not in the acceptedTypes array', function(done) {
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

          done();
        });

        $rootScope.$digest();
      });

      it('should filter providers that are not in the acceptedTypes array, when provider has multiple types', function(done) {
        providers.add({
          name: 'provider',
          types: ['type1', 'type2'],
          buildFetchContext: sinon.stub().returns($q.when()),
          fetch: sinon.stub().returns($q.when())
        });

        providers.getAll({ acceptedTypes: ['type3'] }).then(function(providers) {
          expect(providers).to.deep.equal([]);

          done();
        });

        $rootScope.$digest();
      });

      it('should include providers that are in the acceptedTypes array, when provider has multiple types', function(done) {
        providers.add({
          name: 'provider',
          types: ['type1', 'type2'],
          buildFetchContext: sinon.stub().returns($q.when()),
          fetch: sinon.stub().returns($q.when())
        });

        providers.getAll({ acceptedTypes: ['type2'] }).then(function(providers) {
          expect(providers).to.shallowDeepEqual([{ name: 'provider' }]);

          done();
        });

        $rootScope.$digest();
      });

      it('should filter providers that are not in the acceptedIds array', function(done) {
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

          done();
        });

        $rootScope.$digest();
      });

      it('should build the fetch context of each provider using its own buildFetchContext function', function(done) {
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

        providers.getAll(getAllOptions).then(function() {
          expect(provider1.buildFetchContext).to.have.been.calledWith(getAllOptions);
          expect(provider2.buildFetchContext).to.have.been.calledWith(getAllOptions);

          expect(provider1.fetch).to.have.been.calledWith('context1');
          expect(provider2.fetch).to.have.been.calledWith('context2');

          done();
        });

        $rootScope.$digest();
      });

      it('should skip providers unable to build their fetch contexts', function(done) {
        providers.add({
          name: 'provider',
          type: 'type1',
          buildFetchContext: sinon.stub().returns($q.reject(new Error('WTF')))
        });
        providers.add({
          name: 'provider2',
          type: 'type2',
          buildFetchContext: sinon.stub().returns($q.when('context2')),
          fetch: sinon.stub().returns($q.when())
        });

        providers.getAll().then(function(providers) {
          expect(providers).to.have.length(1);

          done();
        });

        $rootScope.$digest();
      });

    });

    describe('The remove method', function() {
      var provider1, provider2, provider3, provider4, provider5;

      beforeEach(function() {
        provider1 = {id: 1, name: '1', uid: '1'};
        provider2 = {id: 2, name: '2', uid: '2'};
        provider3 = {id: 3, name: '3', uid: '3'};
        provider4 = {id: 4, name: '4', uid: '4'};
        provider5 = {id: 5, name: '5', uid: '5'};

        [provider1, provider2, [provider3, provider4], provider5].forEach(function(provider) {
          providers.add(provider);
        });
      });

      it('should not remove any provider if any match', function() {
        var thenSpy = sinon.spy();

        providers.remove(_.constant(false));
        $rootScope.$digest();

        providers.getAllProviderDefinitions().then(thenSpy);

        $rootScope.$digest();
        expect(thenSpy).to.have.been.calledWith(_.flatten([provider1, provider2, provider3, provider4, provider5]));
      });

      it('should correctly remove top level provider', function() {
        var thenSpy = sinon.spy();

        providers.remove(function(provider) {
          return provider.id === 1;
        });
        $rootScope.$digest();

        providers.getAllProviderDefinitions().then(thenSpy);

        $rootScope.$digest();
        expect(thenSpy.firstCall).to.have.been.calledWith(_.flatten([provider2, provider3, provider4, provider5]));

        providers.remove(function(provider) {
          return provider.id === 5;
        });
        $rootScope.$digest();

        providers.getAllProviderDefinitions().then(thenSpy);
        $rootScope.$digest();

        expect(thenSpy.secondCall).to.have.been.calledWith(_.flatten([provider2, provider3, provider4]));
        $rootScope.$digest();
      });

      it('should correctly remove not top level provider', function() {
        var thenSpy = sinon.spy();

        providers.remove(function(provider) {
          return provider.id === 3;
        });
        $rootScope.$digest();

        providers.getAllProviderDefinitions().then(thenSpy);

        $rootScope.$digest();
        expect(thenSpy.firstCall).to.have.been.calledWith(_.flatten([provider1, provider2, provider4, provider5]));
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

    function assertGroups(tool, element, groupName) {
      var elements = tool.getGroupedElements();

      expect(elements).to.have.length(1);
      expect(elements[0].date).to.equal(element.date);
      expect(elements[0].group.name).to.equal(groupName);
    }

    beforeEach(inject(function(_ByDateElementGroupingTool_) {
      ByDateElementGroupingTool = _ByDateElementGroupingTool_;
    }));

    it('should prevent insertion of duplicate items (items with same id)', function() {
      var tool = new ByDateElementGroupingTool();

      tool.addElement({ id: '000', date: 1 });
      tool.addElement({ id: '123', date: 2 });
      tool.addElement({ id: '123', date: 3 });
      tool.addElement({ id: '555', date: 4 });

      expect(_.pluck(tool.getGroupedElements(), 'id')).to.deep.equal(['555', '123', '000']);
    });

    it('should allow insertion of an item with same id if previous item is removed', function() {
      var tool = new ByDateElementGroupingTool(),
          item = { id: '123', date: 2 };

      tool.addElement({ id: '000', date: 1 });
      tool.addElement(item);
      tool.addElement({ id: '555', date: 4 });

      expect(_.pluck(tool.getGroupedElements(), 'id')).to.deep.equal(['555', '123', '000']);

      tool.removeElement(item);
      tool.addElement(item);

      expect(_.pluck(tool.getGroupedElements(), 'id')).to.deep.equal(['555', '123', '000']);
    });

    it('should allow insertion of an item with same id after reset', function() {
      var tool = new ByDateElementGroupingTool(),
        item = { id: '123', date: 2 };

      tool.addElement({ id: '000', date: 1 });
      tool.addElement(item);
      tool.addElement({ id: '555', date: 4 });

      expect(_.pluck(tool.getGroupedElements(), 'id')).to.deep.equal(['555', '123', '000']);

      tool.reset();
      tool.addElement(item);

      expect(_.pluck(tool.getGroupedElements(), 'id')).to.deep.equal(['123']);
    });

    it('should maintain the array ordered by date in descending order', function() {
      var tool = new ByDateElementGroupingTool();

      tool.addElement({ id: 1, date: 2 });
      tool.addElement({ id: 2, date: 3 });

      expect(_.pluck(tool.getGroupedElements(), 'date')).to.deep.equal([3, 2]);

      tool.addElement({ id: 3, date: 4 });
      tool.addElement({ id: 4, date: 1 });

      expect(_.pluck(tool.getGroupedElements(), 'date')).to.deep.equal([4, 3, 2, 1]);
    });

    it('should return an empty array when no elements are added', function() {
      expect(new ByDateElementGroupingTool().getGroupedElements()).to.deep.equal([]);
    });

    it('should put a received element in the today group if it has the now date', function() {
      var element = { date: nowDate },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      assertGroups(elementGroupingTool, element, 'Today');
    });

    it('should put a received element in the today group if it has the midnight date', function() {
      var element = { date: '2015-08-20T00:10:00Z' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      assertGroups(elementGroupingTool, element, 'Today');
    });

    it('should put a received element in the today group even if it has a future date', function() {
      var element = { date: '2015-08-21T00:10:00Z' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      assertGroups(elementGroupingTool, element, 'Today');
    });

    it('should put a received element in the yesterday group if it is 1 day old', function() {
      var element = { date: '2015-08-19T20:00:00Z' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      assertGroups(elementGroupingTool, element, 'Yesterday');
    });

    it('should put a received element in the week group if it is 2 days old, but in the same week', function() {
      var element = { date: '2015-08-18T04:00:00Z' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      assertGroups(elementGroupingTool, element, 'This Week');
    });

    it('should put a received element in the week group if it is 4 days old, but in the same week', function() {
      var element = { date: '2015-08-16T04:00:00Z' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      assertGroups(elementGroupingTool, element, 'This Week');
    });

    it('should put a received element in the month group if it is 7 days old, in the previous week', function() {
      var element = { date: '2015-08-13T04:00:00Z' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      assertGroups(elementGroupingTool, element, 'This Month');
    });

    it('should put a received element in the month group if it is just older than one week', function() {
      var element = { date: '2015-08-12T22:00:00Z' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      assertGroups(elementGroupingTool, element, 'This Month');
    });

    it('should put a received element in the week group if it is just newer than one week with both +7 TZ', function() {
      localTimeZone = 'Asia/Ho_Chi_Minh';

      var element = { date: '2015-08-16T08:00:00+07:00' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      assertGroups(elementGroupingTool, element, 'This Week');
    });

    it('should put a received element in the week group if it is just newer than one week when element +7 TZ', function() {
      localTimeZone = 'UTC';

      var element = { date: '2015-08-16T08:00:00+07:00' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      assertGroups(elementGroupingTool, element, 'This Week');
    });

    it('should put a received element in the week group if it is just newer than one week when now +7 TZ', function() {
      localTimeZone = 'Asia/Ho_Chi_Minh';
      nowDate = new Date('2015-08-21T05:00:00+07:00');

      var element = { date: '2015-08-16T01:00:00+00:00' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      assertGroups(elementGroupingTool, element, 'This Week');
    });

    it('should put a received element in the month group if it is just older than one week with both +7 TZ', function() {
      localTimeZone = 'Asia/Ho_Chi_Minh';

      var element = { date: '2015-08-15T23:00:00+07:00' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      assertGroups(elementGroupingTool, element, 'This Month');
    });

    it('should put a received element in the month group if it is just older than one week when element +7 TZ', function() {
      localTimeZone = 'UTC';
      var element = { date: '2015-08-15T05:00:00+07:00' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      assertGroups(elementGroupingTool, element, 'This Month');
    });

    it('should put a received element in the month group if it is just older than one week when now +7 TZ', function() {
      localTimeZone = 'Asia/Ho_Chi_Minh';
      var element = { date: '2015-08-15T22:00:00+00:00' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      assertGroups(elementGroupingTool, element, 'This Month');
    });

    it('should put a received element in the month group if it is just older than one week with both -7 TZ', function() {
      localTimeZone = 'America/Los_Angeles';
      var element = { date: '2015-08-15T15:00:00-07:00' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      assertGroups(elementGroupingTool, element, 'This Month');
    });

    it('should put a received element in the month group if it is just older than one week when element -7 TZ', function() {
      localTimeZone = 'UTC';
      var element = { date: '2015-08-15T15:00:00-07:00' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      assertGroups(elementGroupingTool, element, 'This Month');
    });

    it('should put a received element in the month group if it is just older than one week when now -7 TZ', function() {
      localTimeZone = 'America/Los_Angeles';
      var element = { date: '2015-08-15T22:00:00+00:00' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      assertGroups(elementGroupingTool, element, 'This Month');
    });

    it('should put a received element in the month group if its date is the first of the month', function() {
      var element = { date: '2015-08-01T04:00:00Z' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      assertGroups(elementGroupingTool, element, 'This Month');
    });

    it('should put a received element in the older group if its date is the last day of the previous month', function() {
      var element = { date: '2015-07-31T04:00:00Z' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      assertGroups(elementGroupingTool, element, 'Older than a month');
    });

    describe('The removeElement method', function() {

      it('should remove the element from group', function() {
        var element1 = { date: '2015-05-31T04:00:00Z' },
            element2 = { date: '2015-07-31T04:00:00Z' },
            elementGroupingTool = new ByDateElementGroupingTool([element1, element2]);

        elementGroupingTool.removeElement(element2);

        assertGroups(elementGroupingTool, element1, 'Older than a month');
      });

    });

    describe('The removeElements method', function() {

      it('should remove all elements from group', function() {
        var element1 = { date: '2015-05-31T04:00:00Z' },
            element2 = { date: '2015-07-31T04:00:00Z' },
            elementGroupingTool = new ByDateElementGroupingTool([element1, element2]);

        elementGroupingTool.removeElements([element2, element1]);

        expect(elementGroupingTool.getGroupedElements()).to.deep.equal([]);
      });

    });

    describe('The getById method', function() {

      it('should return undefined if the element does not exist', function() {
        expect(new ByDateElementGroupingTool().getById('nonExistentId')).to.equal(undefined);
      });

      it('should return the element if the it exists', function() {
        var elementGroupingTool = new ByDateElementGroupingTool(),
            element = { id: 'myId', date: '2015-05-31T04:00:00Z' };

        elementGroupingTool.addElement(element);

        expect(elementGroupingTool.getById('myId')).to.equal(element);
      });

    });

  });

  describe('The sortByDateInDescendingOrder factory', function() {

    var sortByDateInDescendingOrder;

    beforeEach(inject(function(_sortByDateInDescendingOrder_) {
      sortByDateInDescendingOrder = _sortByDateInDescendingOrder_;
    }));

    it('should sort an array by date in descending order', function() {
      expect([{ date: 1 }, { date: 3 }, { date: 0 }].sort(sortByDateInDescendingOrder)).to.deep.equal([{ date: 3 }, { date: 1 }, { date: 0 }]);
    });

  });

  describe('The toAggregatorSource factory', function() {

    var toAggregatorSource, $rootScope;

    beforeEach(inject(function(_toAggregatorSource_, _$rootScope_) {
      toAggregatorSource = _toAggregatorSource_;
      $rootScope = _$rootScope_;
    }));

    it('should add a loadNextItems and loadRecentItems function to the provider', function() {
      var source = toAggregatorSource({ fetch: function() {} });

      expect(source.loadNextItems).to.be.a('function');
      expect(source.loadRecentItems).to.be.a('function');
    });

    it('should format results according to the aggregator expectations', function(done) {
      var provider = {
        templateUrl: 'templateUrl',
        fetch: function() {
          return function() {
            return $q.when([{ date: '2017-01-01T00:00:00Z' }]);
          };
        }
      };
      var source = toAggregatorSource(provider);

      source.loadNextItems().then(function(data) {
        expect(data).to.deep.equal({
          data: [{
            date: new Date(Date.UTC(2017, 0, 1, 0, 0, 0, 0)),
            templateUrl: 'templateUrl',
            provider: provider
          }],
          lastPage: true
        });

        done();
      });
      $rootScope.$digest();
    });

    it('should request recent items based on the most recent item known', function(done) {
      var provider = {
        templateUrl: 'templateUrl',
        fetch: function() {
          var fetcher = function() {
            return $q.when([{ date: '2017-01-01T00:00:00Z' }, { date: '2016-01-01T00:00:00Z' }]);
          };

          fetcher.loadRecentItems = function(item) {
            expect(item).to.deep.equal({
              date: new Date(Date.UTC(2017, 0, 1, 0, 0, 0, 0)),
              templateUrl: 'templateUrl',
              provider: provider
            });

            done();
          };

          return fetcher;
        }
      };
      var source = toAggregatorSource(provider);

      source.loadNextItems();
      $rootScope.$digest();

      source.loadRecentItems();
      $rootScope.$digest();
    });

    it('should update most recent item when fetching recent items', function(done) {
      var called = 0,
          provider = {
            templateUrl: 'templateUrl',
            fetch: function() {
              var expectedItem1 = {
                    date: new Date(Date.UTC(2016, 0, 1, 0, 0, 0, 0)),
                    templateUrl: 'templateUrl',
                    provider: provider
                  },
                  expectedItem2 = {
                    date: new Date(Date.UTC(2017, 0, 1, 0, 0, 0, 0)),
                    templateUrl: 'templateUrl',
                    provider: provider
                  };

              var fetcher = function() {
                return $q.when([{ date: '2016-01-01T00:00:00Z' }]);
              };

              fetcher.loadRecentItems = function(item) {
                expect(item).to.deep.equal(++called === 1 ? expectedItem1 : expectedItem2);

                if (called === 2) {
                  return done();
                }

                return $q.when([{ date: '2017-01-01T00:00:00Z' }]);
              };

              return fetcher;
            }
          },
          source = toAggregatorSource(provider);

      source.loadNextItems();
      $rootScope.$digest();

      source.loadRecentItems();
      $rootScope.$digest();

      source.loadRecentItems();
      $rootScope.$digest();
    });

  });

});
