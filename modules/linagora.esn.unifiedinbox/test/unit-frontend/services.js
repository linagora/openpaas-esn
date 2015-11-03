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

      it('should do nothing if needToBeSaved returns false', function() {
        jmapClient.saveAsDraft = sinon.spy();

        var draft = draftService.startDraft({});
        draft.needToBeSaved = function() {return false;};
        draft.save({});

        expect(jmapClient.saveAsDraft).to.not.have.been.called;
      });

      it('should call saveAsDraft if needToBeSaved returns true', function() {
        jmapClient.saveAsDraft = sinon.stub().returns($q.when({}));

        var draft = draftService.startDraft({});
        draft.needToBeSaved = function() {return true;};
        draft.save({rcpt: {}});

        expect(jmapClient.saveAsDraft).to.have.been.called;
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
        draft.save({rcpt: {}});

        $rootScope.$digest();
        expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Your email has not been saved');
        expect($log.error).to.have.been.calledWith('A draft has not been saved', err);
      });

    });

  });

});
