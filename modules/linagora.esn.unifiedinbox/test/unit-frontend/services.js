'use strict';

/* global chai: false */
/* global moment: false */

var expect = chai.expect;

describe('The Unified Inbox Angular module services', function() {

  var nowDate = new Date('2015-08-20T04:00:00Z'),
      localTimeZone = 'Europe/Paris';

  beforeEach(function() {
    angular.mock.module('esn.jmap-client-wrapper');
    angular.mock.module('esn.session');
    angular.mock.module('esn.core');
    angular.mock.module('angularMoment');
    angular.mock.module('linagora.esn.unifiedinbox');
  });

  beforeEach(module(function($provide) {
    $provide.constant('moment', function(argument) {
      return moment.tz(argument || nowDate, localTimeZone);
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

    it('should put a received email in the week group if it is just newer than one week with both +7 TZ', function() {
      localTimeZone = 'Asia/Ho_Chi_Minh';

      var email = { date: '2015-08-13T08:00:00+07:00' },
          emailGroupingTool = new EmailGroupingTool('any mailbox id', [email]);

      expect(emailGroupingTool.getGroupedEmails()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', emails: []},
        {name: 'This Week', dateFormat: 'short', emails: [email]},
        {name: 'This Month', dateFormat: 'short', emails: []},
        {name: 'Older than a month', dateFormat: 'fullDate', emails: []}
      ]);
    });

    it('should put a received email in the week group if it is just newer than one week when email +7 TZ', function() {
      localTimeZone = 'UTC';

      var email = { date: '2015-08-13T08:00:00+07:00' },
          emailGroupingTool = new EmailGroupingTool('any mailbox id', [email]);

      expect(emailGroupingTool.getGroupedEmails()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', emails: []},
        {name: 'This Week', dateFormat: 'short', emails: [email]},
        {name: 'This Month', dateFormat: 'short', emails: []},
        {name: 'Older than a month', dateFormat: 'fullDate', emails: []}
      ]);
    });

    it('should put a received email in the week group if it is just newer than one week when now +7 TZ', function() {
      localTimeZone = 'Asia/Ho_Chi_Minh';
      nowDate = new Date('2015-08-21T05:00:00+07:00');

      var email = { date: '2015-08-13T01:00:00+00:00' },
          emailGroupingTool = new EmailGroupingTool('any mailbox id', [email]);

      expect(emailGroupingTool.getGroupedEmails()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', emails: []},
        {name: 'This Week', dateFormat: 'short', emails: [email]},
        {name: 'This Month', dateFormat: 'short', emails: []},
        {name: 'Older than a month', dateFormat: 'fullDate', emails: []}
      ]);
    });

    it('should put a received email in the month group if it is just older than one week with both +7 TZ', function() {
      localTimeZone = 'Asia/Ho_Chi_Minh';

      var email = { date: '2015-08-12T23:00:00+07:00' },
          emailGroupingTool = new EmailGroupingTool('any mailbox id', [email]);

      expect(emailGroupingTool.getGroupedEmails()).to.deep.equal([
        {name: 'Today', dateFormat: 'shortTime', emails: []},
        {name: 'This Week', dateFormat: 'short', emails: []},
        {name: 'This Month', dateFormat: 'short', emails: [email]},
        {name: 'Older than a month', dateFormat: 'fullDate', emails: []}
      ]);
    });

    it('should put a received email in the month group if it is just older than one week when email +7 TZ', function() {
      localTimeZone = 'UTC';
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
      localTimeZone = 'Asia/Ho_Chi_Minh';
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
      localTimeZone = 'America/Los_Angeles';
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
      localTimeZone = 'UTC';
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
      localTimeZone = 'America/Los_Angeles';
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

  describe('The createHtmlElement factory', function() {

    var createHtmlElement;

    beforeEach(inject(function(_createHtmlElement_) {
      createHtmlElement = _createHtmlElement_;
    }));

    it('should return an HTML element', function() {
      expect(createHtmlElement('div').tagName).to.equal('DIV');
    });

    it('should not fail when no attributes are given', function() {
      expect(createHtmlElement('div').attributes).to.have.length(0);
    });

    it('should not fail when an empty object is given as attributes', function() {
      expect(createHtmlElement('div', {}).attributes).to.have.length(0);
    });

    it('should merge attributes in the resulting element', function() {
      expect(createHtmlElement('script', { type: 'text/javascript' }).attributes[0]).to.shallowDeepEqual({
        name: 'type',
        value: 'text/javascript'
      });
    });

  });

  describe('The emailSendingService factory', function() {
    var emailSendingService, rcpt;

    beforeEach(inject(function(_emailSendingService_) {
      emailSendingService = _emailSendingService_;
    }));

    describe('the noRecipient function', function() {
      it('should return true when no recipient is provided', function() {
        rcpt = {
          to: [],
          cc: [],
          bcc: []
        };
        expect(emailSendingService.noRecipient()).to.be.true;
        expect(emailSendingService.noRecipient({})).to.be.true;
        expect(emailSendingService.noRecipient(rcpt)).to.be.true;
      });

      it('should return false when some recipients are provided', function() {
        rcpt = {
          to: [{displayName: '1', email: '1@linagora.com'}],
          cc: [],
          bcc: []
        };
        expect(emailSendingService.noRecipient(rcpt)).to.be.false;

        rcpt = {
          to: [],
          cc: [{displayName: '1', email: '1@linagora.com'}],
          bcc: []
        };
        expect(emailSendingService.noRecipient(rcpt)).to.be.false;
      });
    });

    describe('the emailsAreValid function', function() {
      it('should return false when some recipients emails are not valid', function() {
        rcpt = {
          to: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}],
          cc: [{displayName: '1', email: '1@linagora.com'}, {displayName: '3', email: '3linagora.com'}],
          bcc: []
        };
        expect(emailSendingService.emailsAreValid(rcpt)).to.be.false;
      });

      it('should return true when all recipients emails are valid', function() {
        rcpt = {
          to: [{displayName: '1', email: '1@linagora.com'}],
          cc: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}],
          bcc: [{displayName: '3', email: '3@linagora.com'}]
        };
        expect(emailSendingService.emailsAreValid(rcpt)).to.be.true;
      });
    });

    describe('the removeDuplicateRecipients function', function() {
      var expectedRcpt;

      it('should return the same object when recipients emails are all different', function() {
        rcpt = {
          to: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}],
          cc: [{displayName: '3', email: '3@linagora.com'}, {displayName: '4', email: '4@linagora.com'}],
          bcc: [{displayName: '5', email: '5@linagora.com'}, {displayName: '6', email: '6@linagora.com'}]
        };
        expectedRcpt = {
          to: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}],
          cc: [{displayName: '3', email: '3@linagora.com'}, {displayName: '4', email: '4@linagora.com'}],
          bcc: [{displayName: '5', email: '5@linagora.com'}, {displayName: '6', email: '6@linagora.com'}]
        };
        emailSendingService.removeDuplicateRecipients(rcpt);
        expect(expectedRcpt).to.shallowDeepEqual(rcpt);
      });

      it('should delete duplicated emails in the following priority: to => cc => bcc', function() {
        rcpt = {
          to: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}],
          cc: [{displayName: '2', email: '2@linagora.com'}, {displayName: '4', email: '4@linagora.com'}],
          bcc: [{displayName: '4', email: '4@linagora.com'}, {displayName: '6', email: '6@linagora.com'}]
        };
        expectedRcpt = {
          to: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}],
          cc: [{displayName: '4', email: '4@linagora.com'}],
          bcc: [{displayName: '6', email: '6@linagora.com'}]
        };
        emailSendingService.removeDuplicateRecipients(rcpt);
        expect(expectedRcpt).to.shallowDeepEqual(rcpt);

        rcpt = {
          to: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}],
          cc: [{displayName: '3', email: '3@linagora.com'}, {displayName: '4', email: '4@linagora.com'}],
          bcc: [{displayName: '1', email: '1@linagora.com'}, {displayName: '4', email: '4@linagora.com'}]
        };
        expectedRcpt = {
          to: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}],
          cc: [{displayName: '3', email: '3@linagora.com'}, {displayName: '4', email: '4@linagora.com'}],
          bcc: []
        };
        emailSendingService.removeDuplicateRecipients(rcpt);
        expect(expectedRcpt).to.shallowDeepEqual(rcpt);
      });
    });
  });

});
