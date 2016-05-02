'use strict';

/* global chai: false */
/* global moment: false */
var expect = chai.expect;

describe('The esn.provider module', function() {

  var nowDate = new Date('2015-08-20T04:00:00Z'),
      localTimeZone = 'Europe/Paris';

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

    beforeEach(inject(function(_ByDateElementGroupingTool_) {
      ByDateElementGroupingTool = _ByDateElementGroupingTool_;
    }));

    it('should build an array of empty groups when no elements are added', function() {
      var elementGroupingTool = new ByDateElementGroupingTool();

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', elements: []},
        {name: 'This Week', dateFormat: 'short', elements: []},
        {name: 'This Month', dateFormat: 'short', elements: []},
        {name: 'Older than a month', dateFormat: 'fullDate', elements: []}
      ]);
    });

    it('should put a received element in the today group if it has the now date', function() {
      var element = { date: nowDate },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', elements: [element]},
        {name: 'This Week', dateFormat: 'short', elements: []},
        {name: 'This Month', dateFormat: 'short', elements: []},
        {name: 'Older than a month', dateFormat: 'fullDate', elements: []}
      ]);
    });

    it('should put a received element in the today group if it has the midnight date', function() {
      var element = { date: '2015-08-20T00:10:00Z' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', elements: [element]},
        {name: 'This Week', dateFormat: 'short', elements: []},
        {name: 'This Month', dateFormat: 'short', elements: []},
        {name: 'Older than a month', dateFormat: 'fullDate', elements: []}
      ]);
    });

    it('should put a received element in the today group even if it has a future date', function() {
      var element = { date: '2015-08-21T00:10:00Z' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', elements: [element]},
        {name: 'This Week', dateFormat: 'short', elements: []},
        {name: 'This Month', dateFormat: 'short', elements: []},
        {name: 'Older than a month', dateFormat: 'fullDate', elements: []}
      ]);
    });

    it('should put a received element in the week group if it is 1 day old', function() {
      var element = { date: '2015-08-19T20:00:00Z' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', elements: []},
        {name: 'This Week', dateFormat: 'short', elements: [element]},
        {name: 'This Month', dateFormat: 'short', elements: []},
        {name: 'Older than a month', dateFormat: 'fullDate', elements: []}
      ]);
    });

    it('should put a received element in the week group if it is 7 days old', function() {
      var element = { date: '2015-08-13T04:00:00Z' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', elements: []},
        {name: 'This Week', dateFormat: 'short', elements: [element]},
        {name: 'This Month', dateFormat: 'short', elements: []},
        {name: 'Older than a month', dateFormat: 'fullDate', elements: []}
      ]);
    });

    it('should put a received element in the month group if it is just older than one week', function() {
      var element = { date: '2015-08-12T22:00:00Z' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', elements: []},
        {name: 'This Week', dateFormat: 'short', elements: []},
        {name: 'This Month', dateFormat: 'short', elements: [element]},
        {name: 'Older than a month', dateFormat: 'fullDate', elements: []}
      ]);
    });

    it('should put a received element in the week group if it is just newer than one week with both +7 TZ', function() {
      localTimeZone = 'Asia/Ho_Chi_Minh';

      var element = { date: '2015-08-13T08:00:00+07:00' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', elements: []},
        {name: 'This Week', dateFormat: 'short', elements: [element]},
        {name: 'This Month', dateFormat: 'short', elements: []},
        {name: 'Older than a month', dateFormat: 'fullDate', elements: []}
      ]);
    });

    it('should put a received element in the week group if it is just newer than one week when element +7 TZ', function() {
      localTimeZone = 'UTC';

      var element = { date: '2015-08-13T08:00:00+07:00' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', elements: []},
        {name: 'This Week', dateFormat: 'short', elements: [element]},
        {name: 'This Month', dateFormat: 'short', elements: []},
        {name: 'Older than a month', dateFormat: 'fullDate', elements: []}
      ]);
    });

    it('should put a received element in the week group if it is just newer than one week when now +7 TZ', function() {
      localTimeZone = 'Asia/Ho_Chi_Minh';
      nowDate = new Date('2015-08-21T05:00:00+07:00');

      var element = { date: '2015-08-13T01:00:00+00:00' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', elements: []},
        {name: 'This Week', dateFormat: 'short', elements: [element]},
        {name: 'This Month', dateFormat: 'short', elements: []},
        {name: 'Older than a month', dateFormat: 'fullDate', elements: []}
      ]);
    });

    it('should put a received element in the month group if it is just older than one week with both +7 TZ', function() {
      localTimeZone = 'Asia/Ho_Chi_Minh';

      var element = { date: '2015-08-12T23:00:00+07:00' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', elements: []},
        {name: 'This Week', dateFormat: 'short', elements: []},
        {name: 'This Month', dateFormat: 'short', elements: [element]},
        {name: 'Older than a month', dateFormat: 'fullDate', elements: []}
      ]);
    });

    it('should put a received element in the month group if it is just older than one week when element +7 TZ', function() {
      localTimeZone = 'UTC';
      var element = { date: '2015-08-13T05:00:00+07:00' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', elements: []},
        {name: 'This Week', dateFormat: 'short', elements: []},
        {name: 'This Month', dateFormat: 'short', elements: [element]},
        {name: 'Older than a month', dateFormat: 'fullDate', elements: []}
      ]);
    });

    it('should put a received element in the month group if it is just older than one week when now +7 TZ', function() {
      localTimeZone = 'Asia/Ho_Chi_Minh';
      var element = { date: '2015-08-12T22:00:00+00:00' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', elements: []},
        {name: 'This Week', dateFormat: 'short', elements: []},
        {name: 'This Month', dateFormat: 'short', elements: [element]},
        {name: 'Older than a month', dateFormat: 'fullDate', elements: []}
      ]);
    });

    it('should put a received element in the month group if it is just older than one week with both -7 TZ', function() {
      localTimeZone = 'America/Los_Angeles';
      var element = { date: '2015-08-12T15:00:00-07:00' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', elements: []},
        {name: 'This Week', dateFormat: 'short', elements: []},
        {name: 'This Month', dateFormat: 'short', elements: [element]},
        {name: 'Older than a month', dateFormat: 'fullDate', elements: []}
      ]);
    });

    it('should put a received element in the month group if it is just older than one week when element -7 TZ', function() {
      localTimeZone = 'UTC';
      var element = { date: '2015-08-12T15:00:00-07:00' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', elements: []},
        {name: 'This Week', dateFormat: 'short', elements: []},
        {name: 'This Month', dateFormat: 'short', elements: [element]},
        {name: 'Older than a month', dateFormat: 'fullDate', elements: []}
      ]);
    });

    it('should put a received element in the month group if it is just older than one week when now -7 TZ', function() {
      localTimeZone = 'America/Los_Angeles';
      var element = { date: '2015-08-12T22:00:00+00:00' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', elements: []},
        {name: 'This Week', dateFormat: 'short', elements: []},
        {name: 'This Month', dateFormat: 'short', elements: [element]},
        {name: 'Older than a month', dateFormat: 'fullDate', elements: []}
      ]);
    });

    it('should put a received element in the month group if its date is the first of the month', function() {
      var element = { date: '2015-08-01T04:00:00Z' },
          elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', elements: []},
        {name: 'This Week', dateFormat: 'short', elements: []},
        {name: 'This Month', dateFormat: 'short', elements: [element]},
        {name: 'Older than a month', dateFormat: 'fullDate', elements: []}
      ]);
    });

    it('should put a received element in the older group if its date is the last day of the previous month', function() {
      var element = { date: '2015-07-31T04:00:00Z' },
        elementGroupingTool = new ByDateElementGroupingTool([element]);

      expect(elementGroupingTool.getGroupedElements()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', elements: []},
        {name: 'This Week', dateFormat: 'short', elements: []},
        {name: 'This Month', dateFormat: 'short', elements: []},
        {name: 'Older than a month', dateFormat: 'fullDate', elements: [element]}
      ]);
    });

  });

});
