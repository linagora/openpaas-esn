'use strict';

/* global chai: false */
/* global moment: false */
/* global sinon: false */

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

    describe('the ensureEmailAndNameField function', function() {
      it('should do nothing if name and email are already defined', function() {
        expect(emailSendingService.ensureEmailAndNameFields({name: 'user', email: 'user@domain', displayName: 'disp'}))
          .to.deep.equal({name: 'user', email: 'user@domain', displayName: 'disp'});
      });
      it('should do nothing if displayName is undefined', function() {
        expect(emailSendingService.ensureEmailAndNameFields({}))
          .to.deep.equal({});
      });
      it('should assign name only if email is already defined', function() {
        expect(emailSendingService.ensureEmailAndNameFields({email: 'user@domain', displayName: 'disp'}))
          .to.deep.equal({name: 'disp', email: 'user@domain', displayName: 'disp'});
      });
      it('should assign email only if name is already defined', function() {
        expect(emailSendingService.ensureEmailAndNameFields({name: 'user', displayName: 'disp'}))
          .to.deep.equal({name: 'user', email: 'disp', displayName: 'disp'});
      });
      it('should assign name and email if both are undefined', function() {
        expect(emailSendingService.ensureEmailAndNameFields({displayName: 'disp'}))
          .to.deep.equal({name: 'disp', email: 'disp', displayName: 'disp'});
      });
      it('should assign name and email if both are empty', function() {
        expect(emailSendingService.ensureEmailAndNameFields({name: '', email: '', displayName: 'disp'}))
          .to.deep.equal({name: 'disp', email: 'disp', displayName: 'disp'});
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

  describe('The draftService service', function() {

    var draftService, jmapClient, session, notificationFactory, $log, $rootScope;

    beforeEach(inject(function(_draftService_, _jmapClient_, _session_, _notificationFactory_, _$log_, _$rootScope_) {
      draftService = _draftService_;
      jmapClient = _jmapClient_;
      session = _session_;
      notificationFactory = _notificationFactory_;
      $log = _$log_;
      $rootScope = _$rootScope_;
    }));

    describe('The needToBeSaved method', function() {

      it('should return false if original and new are both undefined object', function() {
        var draft = draftService.startDraft(undefined);
        expect(draft.needToBeSaved(undefined)).to.equal(false);
      });

      it('should return false if original and new are both empty object', function() {
        var draft = draftService.startDraft({});
        expect(draft.needToBeSaved({})).to.equal(false);
      });

      it('should look for differences after having copying original', function() {
        var content = {subject: 'yo'};

        var draft = draftService.startDraft(content);
        content.subject = 'lo';

        expect(draft.needToBeSaved(content)).to.equal(true);
      });

      it('should return false if original and new are equal', function() {
        var draft = draftService.startDraft({
          subject: 'yo',
          htmlBody: 'text',
          rcpt: {
            to: [{email: 'to@domain'}],
            cc: [{email: 'cc@domain'}],
            bcc: [{email: 'bcc@domain'}]
          }
        });
        expect(draft.needToBeSaved({
          subject: 'yo',
          htmlBody: 'text',
          rcpt: {
            to: [{email: 'to@domain'}],
            cc: [{email: 'cc@domain'}],
            bcc: [{email: 'bcc@domain'}]
          }
        })).to.equal(false);
      });

      it('should return false if only order changes', function() {
        var draft = draftService.startDraft({
          subject: 'yo',
          htmlBody: 'text',
          rcpt: {
            to: [{email: 'to1@domain'}, {email: 'to2@domain'}],
            cc: [{email: 'cc1@domain'}, {email: 'cc2@domain'}],
            bcc: [{email: 'bcc1@domain'}, {email: 'bcc2@domain'}]
          }
        });
        expect(draft.needToBeSaved({
          subject: 'yo',
          htmlBody: 'text',
          rcpt: {
            to: [{email: 'to2@domain'}, {email: 'to1@domain'}],
            cc: [{email: 'cc2@domain'}, {email: 'cc1@domain'}],
            bcc: [{email: 'bcc1@domain'}, {email: 'bcc2@domain'}]
          }
        })).to.equal(false);
      });

      it('should return false if only name has changed', function() {
        var draft = draftService.startDraft({
          subject: 'yo',
          htmlBody: 'text',
          rcpt: {
            to: [{email: 'to@domain', name:'before'}]
          }
        });
        expect(draft.needToBeSaved({
          subject: 'yo',
          htmlBody: 'text',
          rcpt: {
            to: [{email: 'to@domain', name:'after'}]
          }
        })).to.equal(false);
      });

      it('should return true if original has one more field', function() {
        var draft = draftService.startDraft({
          subject: 'yo',
          htmlBody: 'text'
        });
        expect(draft.needToBeSaved({
          subject: 'yo'
        })).to.equal(true);
      });

      it('should return true if new state has one more field', function() {
        var draft = draftService.startDraft({
          subject: 'yo'
        });
        expect(draft.needToBeSaved({
          subject: 'yo',
          htmlBody: 'text'
        })).to.equal(true);
      });

      it('should return true if original has difference into rcpt only', function() {
        var draft = draftService.startDraft({
          subject: 'yo',
          htmlBody: 'text',
          rcpt: {to: []}
        });
        expect(draft.needToBeSaved({
          subject: 'yo',
          htmlBody: 'text',
          rcpt: {to: [{email: 'second@domain'}]}
        })).to.equal(true);
      });

      it('should return true if new has difference into to rcpt only', function() {
        var draft = draftService.startDraft({
          subject: 'yo',
          htmlBody: 'text',
          rcpt: {to: [{email: 'first@domain'}]}
        });
        expect(draft.needToBeSaved({
          subject: 'yo',
          htmlBody: 'text',
          rcpt: {to: [{email: 'second@domain'}]}
        })).to.equal(true);
      });

      it('should return true if new has difference into cc rcpt only', function() {
        var draft = draftService.startDraft({
          subject: 'yo',
          htmlBody: 'text',
          rcpt: {cc: [{email: 'first@domain'}]}
        });
        expect(draft.needToBeSaved({
          subject: 'yo',
          htmlBody: 'text',
          rcpt: {cc: [{email: 'second@domain'}]}
        })).to.equal(true);
      });

      it('should return true if new has difference into bcc rcpt only', function() {
        var draft = draftService.startDraft({
          subject: 'yo',
          htmlBody: 'text',
          rcpt: {bcc: [{email: 'first@domain'}]}
        });
        expect(draft.needToBeSaved({
          subject: 'yo',
          htmlBody: 'text',
          rcpt: {bcc: [{email: 'second@domain'}]}
        })).to.equal(true);
      });

      it('should return false if one has empty subject and other one has undefined', function() {
        var draft = draftService.startDraft({
          subject: '',
          htmlBody: 'text'
        });
        expect(draft.needToBeSaved({
          subject: undefined,
          htmlBody: 'text'
        })).to.equal(false);

        var draft2 = draftService.startDraft({
          subject: undefined,
          htmlBody: 'text'
        });
        expect(draft2.needToBeSaved({
          subject: '',
          htmlBody: 'text'
        })).to.equal(false);
      });

      it('should return false if one has space only subject and other one has undefined', function() {
        var draft = draftService.startDraft({
          subject: ' ',
          htmlBody: 'text'
        });
        expect(draft.needToBeSaved({
          subject: undefined,
          htmlBody: 'text'
        })).to.equal(false);

        var draft2 = draftService.startDraft({
          subject: undefined,
          htmlBody: 'text'
        });
        expect(draft2.needToBeSaved({
          subject: ' ',
          htmlBody: 'text'
        })).to.equal(false);
      });

      it('should return false if one has empty body and other one has undefined', function() {
        var draft = draftService.startDraft({
          subject: 'subject',
          htmlBody: undefined
        });
        expect(draft.needToBeSaved({
          subject: 'subject',
          htmlBody: ''
        })).to.equal(false);

        var draft2 = draftService.startDraft({
          subject: 'subject',
          htmlBody: ''
        });
        expect(draft2.needToBeSaved({
          subject: 'subject',
          htmlBody: undefined
        })).to.equal(false);
      });

      it('should return false if one has space only body and other one has undefined', function() {
        var draft = draftService.startDraft({
          subject: 'subject',
          htmlBody: undefined
        });
        expect(draft.needToBeSaved({
          subject: 'subject',
          htmlBody: ' '
        })).to.equal(false);

        var draft2 = draftService.startDraft({
          subject: 'subject',
          htmlBody: ' '
        });
        expect(draft2.needToBeSaved({
          subject: 'subject',
          htmlBody: undefined
        })).to.equal(false);
      });

      it('should return false if original has empty rcpt property', function() {
        var draft = draftService.startDraft({
          subject: 'yo',
          htmlBody: 'text',
          rcpt: {to: []}
        });
        expect(draft.needToBeSaved({
          subject: 'yo',
          htmlBody: 'text'
        })).to.equal(false);
      });

      it('should return false if new has empty rcpt property', function() {
        var draft = draftService.startDraft({
          subject: 'yo',
          htmlBody: 'text'
        });
        expect(draft.needToBeSaved({
          subject: 'yo',
          htmlBody: 'text',
          rcpt: {to: []}
        })).to.equal(false);
      });

    });

    describe('The save method', function() {

      it('should do nothing and return rejected promise if needToBeSaved returns false', function() {
        jmapClient.saveAsDraft = sinon.spy();
        var draft = draftService.startDraft({});
        draft.needToBeSaved = function() {return false;};

        var result = draft.save({});

        expect(jmapClient.saveAsDraft).to.not.have.been.called;
        expect(result).to.be.rejected;
      });

      it('should call saveAsDraft if needToBeSaved returns true', function() {
        jmapClient.saveAsDraft = sinon.stub().returns($q.when({}));
        var draft = draftService.startDraft({});
        draft.needToBeSaved = function() {return true;};

        var result = draft.save({rcpt: {}});

        expect(jmapClient.saveAsDraft).to.have.been.called;
        expect(result).to.be.fulfilled;
      });

      it('should call saveAsDraft with OutboundMessage filled with properties', function() {
        jmapClient.saveAsDraft = sinon.stub().returns($q.when({}));
        session.user = {preferredEmail: 'yo@lo', name: 'me'};

        var draft = draftService.startDraft({});
        draft.needToBeSaved = function() {return true;};
        draft.save({
          subject: 'expected subject',
          htmlBody: 'expected htmlBody',
          rcpt: {
            to: [{email: 'to@domain', name: 'to'}],
            cc: [{email: 'cc@domain', name: 'cc'}],
            bcc: [{email: 'bcc@domain', name: 'bcc'}]
          }
        });

        expect(jmapClient.saveAsDraft).to.have.been.calledWithMatch(
          sinon.match({
            from: {email: 'yo@lo', name: 'me'},
            subject: 'expected subject',
            htmlBody: 'expected htmlBody',
            to: [{email: 'to@domain', name: 'to'}],
            cc: [{email: 'cc@domain', name: 'cc'}],
            bcc: [{email: 'bcc@domain', name: 'bcc'}]
          }));
      });

      it('should map all recipients to name-email tuple', function() {
        jmapClient.saveAsDraft = sinon.stub().returns($q.when({}));
        session.user = {preferredEmail: 'yo@lo', name: 'me'};

        var draft = draftService.startDraft({});
        draft.needToBeSaved = function() {return true;};
        draft.save({
          subject: 'expected subject',
          htmlBody: 'expected htmlBody',
          rcpt: {
            to: [{email: 'to@domain', name: 'to', other: 'value'}],
            cc: [{email: 'cc@domain', name: 'cc'}, {email: 'cc2@domain', other: 'value', name: 'cc2'}]
          }
        });

        expect(jmapClient.saveAsDraft).to.have.been.calledWithMatch(
          sinon.match({
            from: {email: 'yo@lo', name: 'me'},
            subject: 'expected subject',
            htmlBody: 'expected htmlBody',
            to: [{email: 'to@domain', name: 'to'}],
            cc: [{email: 'cc@domain', name: 'cc'}, {email: 'cc2@domain', name: 'cc2'}]
          }));
      });

      it('should notify when has saved successfully', function() {
        jmapClient.saveAsDraft = function() {return $q.when({});};
        notificationFactory.weakInfo = sinon.spy();

        var draft = draftService.startDraft({});
        draft.needToBeSaved = function() {return true;};
        draft.save({rcpt: {}});

        $rootScope.$digest();
        expect(notificationFactory.weakInfo).to.have.been.called;
        expect(notificationFactory.weakInfo).to.have.been.calledWithExactly('Note', 'Your email has been saved as draft');
      });

      it('should notify when has not saved successfully', function() {
        var err = {message: 'rejected with err'};
        jmapClient.saveAsDraft = function() {return $q.reject(err);};
        notificationFactory.weakError = sinon.spy();
        $log.error = sinon.spy();

        var draft = draftService.startDraft({});
        draft.needToBeSaved = function() {return true;};

        var result = draft.save({rcpt: {}});

        $rootScope.$digest();
        expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Your email has not been saved');
        expect($log.error).to.have.been.calledWith('A draft has not been saved', err);
        expect(result).to.be.rejected;
      });

    });

  });

  describe('The newComposerService ', function() {

    var $state, $timeout, newComposerService, screenSize, boxOverlayOpener;

    beforeEach(inject(function(_$state_, _$timeout_, _newComposerService_, _screenSize_, _boxOverlayOpener_) {
      newComposerService = _newComposerService_;
      screenSize = _screenSize_;
      $state = _$state_;
      $timeout = _$timeout_;
      boxOverlayOpener = _boxOverlayOpener_;
    }));

    describe('the "open" method', function() {

      it('should delegate to screenSize to know if the size is "xs"', function(done) {
        screenSize.is = function(size) {
          expect(size).to.equal('xs');
          done();
        };
        newComposerService.open();
      });

      it('should update the location if screenSize returns true', function() {
        screenSize.is = sinon.stub().returns(true);
        $state.go = sinon.spy();

        newComposerService.open();
        $timeout.flush();

        expect($state.go).to.have.been.calledWith('/unifiedinbox/compose', {email: undefined});
      });

      it('should delegate to boxOverlayOpener if screenSize returns false', function() {
        screenSize.is = sinon.stub().returns(false);
        boxOverlayOpener.open = sinon.spy();

        newComposerService.open();

        expect(boxOverlayOpener.open).to.have.been.calledWith({
          title: 'Compose an email',
          templateUrl: '/unifiedinbox/views/composer/box-compose.html'
        });
      });

    });

    describe('the "openDraft" method', function() {

      it('should delegate to screenSize to know if the size is "xs"', function(done) {
        screenSize.is = function(size) {
          expect(size).to.equal('xs');
          done();
        };
        newComposerService.openDraft({id: 'value'});
      });

      it('should update the location with the email id if screenSize returns true', function() {
        screenSize.is = sinon.stub().returns(true);
        $state.go = sinon.spy();

        newComposerService.openDraft({expected: 'field'});
        $timeout.flush();

        expect($state.go).to.have.been.calledWith('/unifiedinbox/compose', {email: {expected: 'field'}});
      });

      it('should delegate to boxOverlayOpener if screenSize returns false', function() {
        screenSize.is = sinon.stub().returns(false);
        boxOverlayOpener.open = sinon.spy();

        newComposerService.openDraft({email: 'object'});

        expect(boxOverlayOpener.open).to.have.been.calledWith({
          title: 'Continue your draft',
          templateUrl: '/unifiedinbox/views/composer/box-compose.html',
          email: {email: 'object'}
        });
      });

    });

  });

  describe('The Composition factory', function() {

    var Composition, draftService, emailSendingService, session, $timeout, Offline,
        notificationFactory, closeNotificationSpy, notificationTitle, notificationText;

    beforeEach(inject(function(_draftService_, _notificationFactory_, _session_, _Offline_,
         _Composition_, _emailSendingService_, _$timeout_) {
      draftService = _draftService_;
      notificationFactory = _notificationFactory_;
      session = _session_;
      Offline = _Offline_;
      Composition = _Composition_;
      emailSendingService = _emailSendingService_;
      $timeout = _$timeout_;
    }));

    beforeEach(inject(function() {
      Offline.state = 'up';
      notificationTitle = '';
      notificationText = '';

      closeNotificationSpy = sinon.spy();

      notificationFactory.weakSuccess = function(callTitle, callText) {
        notificationTitle = callTitle;
        notificationText = callText;
      };

      notificationFactory.weakError = function(callTitle, callText) {
        notificationTitle = callTitle;
        notificationText = callText;
      };

      notificationFactory.notify = function() {
        notificationTitle = 'Info';
        notificationText = 'Sending';
        return {
          close: closeNotificationSpy
        };
      };
    }));

    it('should set the displayName from the name to recipients when instantiated', function() {
      var email = {
        to: [{name: 'name1', email: '1@linagora.com'}],
        cc: [{name: 'name2', email: '2@linagora.com'}],
        bcc: [{name: 'name3', email: '3@linagora.com'}]
      };

      var result = new Composition(email).getEmail();

      expect(result.rcpt).to.deep.equal({
        to: [{name: 'name1', email: '1@linagora.com', displayName: 'name1'}],
        cc: [{name: 'name2', email: '2@linagora.com', displayName: 'name2'}],
        bcc: [{name: 'name3', email: '3@linagora.com', displayName: 'name3'}]
      });
    });

    it('should set the displayName from the email to recipients when instantiated, when no name', function() {
      var email = {
        to: [{email: '1@linagora.com'}],
        cc: [{email: '2@linagora.com'}],
        bcc: [{email: '3@linagora.com'}]
      };

      var result = new Composition(email).getEmail();

      expect(result.rcpt).to.deep.equal({
        to: [{name: undefined, email: '1@linagora.com', displayName: '1@linagora.com'}],
        cc: [{name: undefined, email: '2@linagora.com', displayName: '2@linagora.com'}],
        bcc: [{name: undefined, email: '3@linagora.com', displayName: '3@linagora.com'}]
      });
    });

    it('should start a draft when instantiated', function() {
      draftService.startDraft = sinon.spy();

      new Composition({obj: 'expected'});

      expect(draftService.startDraft).to.have.been
        .calledWith({obj: 'expected', rcpt: { bcc: [], cc: [], to: [] } });
    });

    it('should save the draft when saveDraft is called', function() {
      var saveSpy = sinon.stub().returns($q.when({}));
      draftService.startDraft = function() {
        return {
          save: saveSpy
        };
      };

      var composition = new Composition({obj: 'expected'});
      composition.getEmail().test = 'tested';
      composition.saveDraft();

      expect(saveSpy).to.have.been
        .calledWith({obj: 'expected', test: 'tested', rcpt: { bcc: [], cc: [], to: [] }});
    });

    it('should destroy the original draft when saveDraft is called', function() {
      draftService.startDraft = function() {
        return {
          save: sinon.stub().returns($q.when({}))
        };
      };

      var message = { destroy: sinon.spy() };

      new Composition(message).saveDraft();
      $timeout.flush();

      expect(message.destroy).to.have.been.calledOnce;
    });

    it('"canBeSentOrNotify" fn should returns false when the email has no recipient', function() {
      var email = {
        rcpt: {
          to: [],
          cc: [],
          bcc: []
        }
      };

      var result = new Composition(email).canBeSentOrNotify();

      expect(result).to.equal(false);
      expect(notificationTitle).to.equal('Note');
      expect(notificationText).to.equal('Your email should have at least one recipient');
    });

    it('"canBeSentOrNotify" fn should returns false when the network connection is down', function() {
      Offline.state = 'down';
      var email = {
        to: [{email: '1@linagora.com'}],
        cc: [],
        bcc: []
      };

      var result = new Composition(email).canBeSentOrNotify();

      expect(result).to.equal(false);
      expect(notificationTitle).to.equal('Note');
      expect(notificationText).to.equal('Your device loses its Internet connection. Try later!');
    });

    it('"send" fn should successfully notify when a valid email is sent', function() {
      emailSendingService.sendEmail = sinon.stub().returns($q.when());

      var email = {
        destroy: angular.noop,
        to: [{email: '1@linagora.com'}, {email: '2@linagora.com'}],
        cc: [{email: '1@linagora.com'}, {email: '3@linagora.com'}],
        bcc: [{email: '1@linagora.com'}, {email: '2@linagora.com'}, {email: '4@linagora.com'}]
      };

      var expectedRcpt = {
        to: [{displayName: '1@linagora.com', email: '1@linagora.com'}, {displayName: '2@linagora.com', email: '2@linagora.com'}],
        cc: [{displayName: '3@linagora.com', email: '3@linagora.com'}],
        bcc: [{displayName: '4@linagora.com', email: '4@linagora.com'}]
      };

      var composition = new Composition(email);
      composition.send();
      $timeout.flush();

      expect(composition.getEmail().rcpt).to.shallowDeepEqual(expectedRcpt);
      expect(closeNotificationSpy).to.have.been.calledOnce;
      expect(emailSendingService.sendEmail).to.have.been.calledOnce;
      expect(notificationTitle).to.equal('Success');
      expect(notificationText).to.equal('Your email has been sent');
    });

    it('"send" fn should successfully send an email even if only bcc is used', function() {
      emailSendingService.sendEmail = sinon.stub().returns($q.when());

      var email = {
        destroy: angular.noop,
        to: [],
        cc: [],
        bcc: [{displayName: '1', email: '1@linagora.com'}]
      };

      new Composition(email).send();
      $timeout.flush();

      expect(closeNotificationSpy).to.have.been.calledOnce;
      expect(emailSendingService.sendEmail).to.have.been.calledOnce;
      expect(notificationTitle).to.equal('Success');
      expect(notificationText).to.equal('Your email has been sent');
    });

    it('"send" fn should notify immediately about sending email for slow connection. The final notification is shown once the email is sent', function() {
      emailSendingService.sendEmail = sinon.stub().returns($timeout(function() {
        return $q.when();
      }, 200));

      var email = {
        destroy: angular.noop,
        to: [{displayName: '1', email: '1@linagora.com'}]
      };

      new Composition(email).send();

      expect(notificationTitle).to.equal('Info');
      expect(notificationText).to.equal('Sending');
      $timeout.flush(201);
      expect(closeNotificationSpy).to.have.been.calledOnce;
      expect(emailSendingService.sendEmail).to.have.been.calledOnce;
      expect(notificationTitle).to.equal('Success');
      expect(notificationText).to.equal('Your email has been sent');
    });

    it('"send" fn should notify immediately about sending email for slow connection. this notification is then replaced by an error one in the case of failure', function() {
      emailSendingService.sendEmail = sinon.stub().returns($timeout(function() {
        return $q.reject();
      }, 200));

      var email = {
        destroy: angular.noop,
        to: [{displayName: '1', email: '1@linagora.com'}]
      };

      new Composition(email).send();

      expect(notificationTitle).to.equal('Info');
      expect(notificationText).to.equal('Sending');
      $timeout.flush(201);
      expect(closeNotificationSpy).to.have.been.calledOnce;
      expect(emailSendingService.sendEmail).to.have.been.calledOnce;
      expect(notificationTitle).to.equal('Error');
      expect(notificationText).to.equal('An error has occurred while sending email');
    });

    it('"send" fn should assign email.from using the session before sending', function() {
      emailSendingService.sendEmail = sinon.stub().returns($q.when());
      session.user = 'yolo';

      var email = {
        destroy: angular.noop,
        to: [{name: '1', email: '1@linagora.com'}]
      };

      new Composition(email).send();
      $timeout.flush();

      expect(emailSendingService.sendEmail).to.have.been.calledWith({
        from: 'yolo',
        destroy: angular.noop,
        to: [{name: '1', email: '1@linagora.com'}],
        rcpt: {
          to: [{name: '1', displayName: '1', email: '1@linagora.com'}],
          cc: [],
          bcc: []
        }
      });
    });

    it('"send" fn should destroy the original draft if one', function() {
      emailSendingService.sendEmail = sinon.stub().returns($q.when());

      var message = {
        destroy: sinon.spy(),
        to: [{displayName: '1', email: '1@linagora.com'}]
      };

      new Composition(message).send();
      $timeout.flush();

      expect(message.destroy).to.have.been.calledOnce;
    });

  });
});
