'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Unified Inbox Angular module services', function() {

  var nowDate = new Date('2015-08-20T04:00:00Z');

  beforeEach(function() {
    angular.mock.module('esn.jmap-client-wrapper');
    angular.mock.module('esn.session');
    angular.mock.module('linagora.esn.unifiedinbox');
  });

  beforeEach(module(function($provide) {
    $provide.constant('moment', function(argument) {
      return window.moment(argument || nowDate);
    });
  }));

  describe('The EmailGroupingTool factory', function() {

    var EmailGroupingTool;

    beforeEach(inject(function(_EmailGroupingTool_) {
      EmailGroupingTool = _EmailGroupingTool_;
    }));

    it('should build an array of empty groups when no emails are added', function() {
      var emailGroupingTool = new EmailGroupingTool('any mailbox id');

      expect(emailGroupingTool.getGroupedEmails()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', emails: []},
        {name: 'This Week', dateFormat: 'short', emails: []},
        {name: 'This Month', dateFormat: 'short', emails: []},
        {name: 'Older than a month', dateFormat: 'fullDate', emails: []}
      ]);
    });

    it('should put a received email in the today group if it has the now date', function() {
      var email = { date: nowDate },
          emailGroupingTool = new EmailGroupingTool('any mailbox id', [email]);

      expect(emailGroupingTool.getGroupedEmails()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', emails: [email]},
        {name: 'This Week', dateFormat: 'short', emails: []},
        {name: 'This Month', dateFormat: 'short', emails: []},
        {name: 'Older than a month', dateFormat: 'fullDate', emails: []}
      ]);
    });

    it('should put a received email in the today group if it has the midnight date', function() {
      var email = { date: '2015-08-20T00:10:00Z' },
          emailGroupingTool = new EmailGroupingTool('any mailbox id', [email]);

      expect(emailGroupingTool.getGroupedEmails()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', emails: [email]},
        {name: 'This Week', dateFormat: 'short', emails: []},
        {name: 'This Month', dateFormat: 'short', emails: []},
        {name: 'Older than a month', dateFormat: 'fullDate', emails: []}
      ]);
    });

    it('should put a received email in the today group even if it has a future date', function() {
      var email = { date: '2015-08-21T00:10:00Z' },
          emailGroupingTool = new EmailGroupingTool('any mailbox id', [email]);

      expect(emailGroupingTool.getGroupedEmails()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', emails: [email]},
        {name: 'This Week', dateFormat: 'short', emails: []},
        {name: 'This Month', dateFormat: 'short', emails: []},
        {name: 'Older than a month', dateFormat: 'fullDate', emails: []}
      ]);
    });

    it('should put a received email in the week group if it is 1 day old', function() {
      var email = { date: '2015-08-19T20:00:00Z' },
          emailGroupingTool = new EmailGroupingTool('any mailbox id', [email]);

      expect(emailGroupingTool.getGroupedEmails()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', emails: []},
        {name: 'This Week', dateFormat: 'short', emails: [email]},
        {name: 'This Month', dateFormat: 'short', emails: []},
        {name: 'Older than a month', dateFormat: 'fullDate', emails: []}
      ]);
    });

    it('should put a received email in the week group if it is 7 days old', function() {
      var email = { date: '2015-08-13T04:00:00Z' },
          emailGroupingTool = new EmailGroupingTool('any mailbox id', [email]);

      expect(emailGroupingTool.getGroupedEmails()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', emails: []},
        {name: 'This Week', dateFormat: 'short', emails: [email]},
        {name: 'This Month', dateFormat: 'short', emails: []},
        {name: 'Older than a month', dateFormat: 'fullDate', emails: []}
      ]);
    });

    it('should put a received email in the month group if it is just older than one week', function() {
      var email = { date: '2015-08-12T22:00:00Z' },
          emailGroupingTool = new EmailGroupingTool('any mailbox id', [email]);

      expect(emailGroupingTool.getGroupedEmails()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', emails: []},
        {name: 'This Week', dateFormat: 'short', emails: []},
        {name: 'This Month', dateFormat: 'short', emails: [email]},
        {name: 'Older than a month', dateFormat: 'fullDate', emails: []}
      ]);
    });

    it('should put a received email in the month group if it is just older than one week with both +7 TZ', function() {
      var email = { date: '2015-08-13T05:00:00+07:00' },
          emailGroupingTool = new EmailGroupingTool('any mailbox id', [email]);

      expect(emailGroupingTool.getGroupedEmails()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', emails: []},
        {name: 'This Week', dateFormat: 'short', emails: []},
        {name: 'This Month', dateFormat: 'short', emails: [email]},
        {name: 'Older than a month', dateFormat: 'fullDate', emails: []}
      ]);
    });

    it('should put a received email in the month group if it is just older than one week when email +7 TZ', function() {
      var email = { date: '2015-08-13T05:00:00+07:00' },
          emailGroupingTool = new EmailGroupingTool('any mailbox id', [email]);

      expect(emailGroupingTool.getGroupedEmails()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', emails: []},
        {name: 'This Week', dateFormat: 'short', emails: []},
        {name: 'This Month', dateFormat: 'short', emails: [email]},
        {name: 'Older than a month', dateFormat: 'fullDate', emails: []}
      ]);
    });

    it('should put a received email in the month group if it is just older than one week when now +7 TZ', function() {
      var email = { date: '2015-08-12T22:00:00+00:00' },
          emailGroupingTool = new EmailGroupingTool('any mailbox id', [email]);

      expect(emailGroupingTool.getGroupedEmails()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', emails: []},
        {name: 'This Week', dateFormat: 'short', emails: []},
        {name: 'This Month', dateFormat: 'short', emails: [email]},
        {name: 'Older than a month', dateFormat: 'fullDate', emails: []}
      ]);
    });

    it('should put a received email in the month group if it is just older than one week with both -7 TZ', function() {
      var email = { date: '2015-08-12T15:00:00-07:00' },
          emailGroupingTool = new EmailGroupingTool('any mailbox id', [email]);

      expect(emailGroupingTool.getGroupedEmails()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', emails: []},
        {name: 'This Week', dateFormat: 'short', emails: []},
        {name: 'This Month', dateFormat: 'short', emails: [email]},
        {name: 'Older than a month', dateFormat: 'fullDate', emails: []}
      ]);
    });

    it('should put a received email in the month group if it is just older than one week when email -7 TZ', function() {
      var email = { date: '2015-08-12T15:00:00-07:00' },
          emailGroupingTool = new EmailGroupingTool('any mailbox id', [email]);

      expect(emailGroupingTool.getGroupedEmails()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', emails: []},
        {name: 'This Week', dateFormat: 'short', emails: []},
        {name: 'This Month', dateFormat: 'short', emails: [email]},
        {name: 'Older than a month', dateFormat: 'fullDate', emails: []}
      ]);
    });

    it('should put a received email in the month group if it is just older than one week when now -7 TZ', function() {
      var email = { date: '2015-08-12T22:00:00+00:00' },
          emailGroupingTool = new EmailGroupingTool('any mailbox id', [email]);

      expect(emailGroupingTool.getGroupedEmails()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', emails: []},
        {name: 'This Week', dateFormat: 'short', emails: []},
        {name: 'This Month', dateFormat: 'short', emails: [email]},
        {name: 'Older than a month', dateFormat: 'fullDate', emails: []}
      ]);
    });

    it('should put a received email in the month group if its date is the first of the month', function() {
      var email = { date: '2015-08-01T04:00:00Z' },
          emailGroupingTool = new EmailGroupingTool('any mailbox id', [email]);

      expect(emailGroupingTool.getGroupedEmails()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', emails: []},
        {name: 'This Week', dateFormat: 'short', emails: []},
        {name: 'This Month', dateFormat: 'short', emails: [email]},
        {name: 'Older than a month', dateFormat: 'fullDate', emails: []}
      ]);
    });

    it('should put a received email in the older group if its date is the last day of the previous month', function() {
      var email = { date: '2015-07-31T04:00:00Z' },
          emailGroupingTool = new EmailGroupingTool('any mailbox id', [email]);

      expect(emailGroupingTool.getGroupedEmails()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', emails: []},
        {name: 'This Week', dateFormat: 'short', emails: []},
        {name: 'This Month', dateFormat: 'short', emails: []},
        {name: 'Older than a month', dateFormat: 'fullDate', emails: [email]}
      ]);
    });

  });

});
