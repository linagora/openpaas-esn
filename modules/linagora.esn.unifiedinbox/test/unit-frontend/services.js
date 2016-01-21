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
    angular.mock.module('jadeTemplates');
  });

  beforeEach(module(function($provide) {
    $provide.constant('moment', function(argument) {
      return moment.tz(argument || nowDate, localTimeZone);
    });
  }));

  describe('The jmapClientProvider service', function() {

    var $log, jmap;

    beforeEach(inject(function(_$log_, $httpBackend, _jmap_, jmapClientProvider) {
      this.$httpBackend = $httpBackend;
      this.jmapClientProvider = jmapClientProvider;
      jmap = _jmap_;
      $log = _$log_;
      $log.error = sinon.spy();
    }));

    it('should return a rejected promise if jwt generation fails', function(done) {
      this.$httpBackend.expectGET('/unifiedinbox/api/inbox/jmap-config').respond(200, {
        api: 'the jmap api'
      });
      this.$httpBackend.expectPOST('/api/jwt/generate').respond(500, 'error');

      this.jmapClientProvider.promise.catch(function(err) {
        expect($log.error).to.have.been.calledOnce;
        expect(err).to.be.an.instanceof(Error);
        done();
      });

      this.$httpBackend.flush();
    });

    it('should return a rejected promise if jmap config lookup fails', function(done) {
      this.$httpBackend.expectGET('/unifiedinbox/api/inbox/jmap-config').respond(500, 'error');
      this.$httpBackend.expectPOST('/api/jwt/generate').respond(200, 'expected jwt');

      this.jmapClientProvider.promise.catch(function(err) {
        expect($log.error).to.have.been.calledOnce;
        expect(err).to.be.an.instanceof(Error);
        done();
      });

      this.$httpBackend.flush();
    });

    it('should return a fulfilled promise if jwt generation succeed', function(done) {
      this.$httpBackend.expectGET('/unifiedinbox/api/inbox/jmap-config').respond(200, {
        api: 'expected jmap api'
      });
      this.$httpBackend.expectPOST('/api/jwt/generate').respond(200, 'expected jwt');

      this.jmapClientProvider.promise.then(function(client) {
        expect(client).to.be.an.instanceof(jmap.Client);
        expect(client.authToken).to.equal('Bearer expected jwt');
        expect(client.apiUrl).to.equal('expected jmap api');
        done();
      });

      this.$httpBackend.flush();
    });

  });

  describe('The withJmapClient factory', function() {

    var jmap;

    beforeEach(inject(function($httpBackend, _jmap_, jmapClientProvider, withJmapClient) {
      this.$httpBackend = $httpBackend;
      this.jmapClientProvider = jmapClientProvider;
      this.withJmapClient = withJmapClient;
      jmap = _jmap_;
    }));

    it('should give the client in the callback when jmapClient is ready', function(done) {
      this.$httpBackend.expectGET('/unifiedinbox/api/inbox/jmap-config').respond(200, {
        api: 'expected jmap api'
      });
      this.$httpBackend.expectPOST('/api/jwt/generate').respond(200, 'the-jwt');

      this.withJmapClient(function(client) {
        expect(client).to.be.an.instanceof(jmap.Client);
        done();
      });

      this.$httpBackend.flush();
    });

    it('should resolve the callback with a null instance and an error when jmapClient cannot be built', function(done) {
      this.$httpBackend.expectGET('/unifiedinbox/api/inbox/jmap-config').respond(500);
      this.$httpBackend.expectPOST('/api/jwt/generate').respond(500);

      this.withJmapClient(function(client, err) {
        expect(client).to.equal(null);
        expect(err).to.be.an.instanceOf(Error);
        done();
      });

      this.$httpBackend.flush();
    });

  });

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
    var emailSendingService, email, $rootScope;

    beforeEach(inject(function(_emailSendingService_, _$rootScope_) {
      emailSendingService = _emailSendingService_;
      $rootScope = _$rootScope_;
    }));

    describe('the noRecipient function', function() {
      it('should return true when no recipient is provided', function() {
        email = {
          to: [],
          cc: [],
          bcc: []
        };
        expect(emailSendingService.noRecipient()).to.be.true;
        expect(emailSendingService.noRecipient({})).to.be.true;
        expect(emailSendingService.noRecipient(email)).to.be.true;
      });

      it('should return false when some recipients are provided', function() {
        email = {
          to: [{displayName: '1', email: '1@linagora.com'}],
          cc: [],
          bcc: []
        };
        expect(emailSendingService.noRecipient(email)).to.be.false;

        email = {
          to: [],
          cc: [{displayName: '1', email: '1@linagora.com'}],
          bcc: []
        };
        expect(emailSendingService.noRecipient(email)).to.be.false;
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
        email = {
          to: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}],
          cc: [{displayName: '1', email: '1@linagora.com'}, {displayName: '3', email: '3linagora.com'}],
          bcc: []
        };
        expect(emailSendingService.emailsAreValid(email)).to.be.false;
      });

      it('should return true when all recipients emails are valid', function() {
        email = {
          to: [{displayName: '1', email: '1@linagora.com'}],
          cc: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}],
          bcc: [{displayName: '3', email: '3@linagora.com'}]
        };
        expect(emailSendingService.emailsAreValid(email)).to.be.true;
      });
    });

    describe('the removeDuplicateRecipients function', function() {
      var expectedEmail;

      it('should return the same object when recipients emails are all different', function() {
        email = {
          to: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}],
          cc: [{displayName: '3', email: '3@linagora.com'}, {displayName: '4', email: '4@linagora.com'}],
          bcc: [{displayName: '5', email: '5@linagora.com'}, {displayName: '6', email: '6@linagora.com'}]
        };
        expectedEmail = {
          to: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}],
          cc: [{displayName: '3', email: '3@linagora.com'}, {displayName: '4', email: '4@linagora.com'}],
          bcc: [{displayName: '5', email: '5@linagora.com'}, {displayName: '6', email: '6@linagora.com'}]
        };
        emailSendingService.removeDuplicateRecipients(email);
        expect(expectedEmail).to.shallowDeepEqual(email);
      });

      it('should delete duplicated emails in the following priority: to => cc => bcc', function() {
        email = {
          to: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}],
          cc: [{displayName: '2', email: '2@linagora.com'}, {displayName: '4', email: '4@linagora.com'}],
          bcc: [{displayName: '4', email: '4@linagora.com'}, {displayName: '6', email: '6@linagora.com'}]
        };
        expectedEmail = {
          to: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}],
          cc: [{displayName: '4', email: '4@linagora.com'}],
          bcc: [{displayName: '6', email: '6@linagora.com'}]
        };
        emailSendingService.removeDuplicateRecipients(email);
        expect(expectedEmail).to.shallowDeepEqual(email);

        email = {
          to: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}],
          cc: [{displayName: '3', email: '3@linagora.com'}, {displayName: '4', email: '4@linagora.com'}],
          bcc: [{displayName: '1', email: '1@linagora.com'}, {displayName: '4', email: '4@linagora.com'}]
        };
        expectedEmail = {
          to: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}],
          cc: [{displayName: '3', email: '3@linagora.com'}, {displayName: '4', email: '4@linagora.com'}],
          bcc: []
        };
        emailSendingService.removeDuplicateRecipients(email);
        expect(expectedEmail).to.shallowDeepEqual(email);
      });
    });

    describe('the prefixSubject function', function() {

      it('should prefix the subject with the required prefix if it does not already exist in the subject', function() {
        expect(emailSendingService.prefixSubject('subject', 'Re: ')).to.equal('Re: subject');
        expect(emailSendingService.prefixSubject('Re:subject', 'Re: ')).to.equal('Re: Re:subject');
      });

      it('should not prefix the subject with the required prefix if it exists in the subject', function() {
        expect(emailSendingService.prefixSubject('Re: subject', 'Re: ')).to.equal('Re: subject');
      });

      it('should ensure that the prefix is suffixed with a space', function() {
        expect(emailSendingService.prefixSubject('subject', 'Re:')).to.equal('Re: subject');
        expect(emailSendingService.prefixSubject('subject', 'Re: ')).to.equal('Re: subject');
      });

      it('should do nothing when subject/prefix is/are not provided', function() {
        expect(emailSendingService.prefixSubject(null, 'Re:')).to.equal(null);
        expect(emailSendingService.prefixSubject('subject', null)).to.equal('subject');
        expect(emailSendingService.prefixSubject(null, null)).to.equal(null);
      });
    });

    describe('the showReplyAllButton function', function() {
      var email;

      it('should return true when more than one recipient is provided', function() {
        email = {
          to: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}],
          cc: [{displayName: '3', email: '3@linagora.com'}, {displayName: '4', email: '4@linagora.com'}],
          bcc: [{displayName: '5', email: '5@linagora.com'}, {displayName: '6', email: '6@linagora.com'}]
        };
        expect(emailSendingService.showReplyAllButton(email)).to.be.true;
      });
      it('should return false when one/zero recipient is provided', function() {
        email = {
          to: [{displayName: '1', email: '1@linagora.com'}],
          cc: [],
          bcc: []
        };
        expect(emailSendingService.showReplyAllButton(email)).to.be.false;
        email = {
        };
        expect(emailSendingService.showReplyAllButton(email)).to.be.false;
      });
    });

    describe('the getReplyAllRecipients function', function() {
      var email, sender, expectedEmail;
      it('should do nothing when email/sender is/are not provided', function() {
        expect(emailSendingService.getReplyAllRecipients(null, {})).to.be.undefined;
        expect(emailSendingService.getReplyAllRecipients({}, null)).to.be.undefined;
        expect(emailSendingService.getReplyAllRecipients(null, null)).to.be.undefined;
      });

      it('should: 1- add FROM to the TO field, 2- do not modify the recipient when the sender is not listed inside', function() {
        email = {
          to: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}],
          cc: [{displayName: '3', email: '3@linagora.com'}, {displayName: '4', email: '4@linagora.com'}],
          bcc: [{displayName: '5', email: '5@linagora.com'}, {displayName: '6', email: '6@linagora.com'}],
          from: {displayName: '0', email: '0@linagora.com'}
        };

        sender =  {displayName: 'sender', email: 'sender@linagora.com'};

        expectedEmail = {
          to: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}, {displayName: '0', email: '0@linagora.com'}],
          cc: [{displayName: '3', email: '3@linagora.com'}, {displayName: '4', email: '4@linagora.com'}],
          bcc: [{displayName: '5', email: '5@linagora.com'}, {displayName: '6', email: '6@linagora.com'}]
        };

        expect(emailSendingService.getReplyAllRecipients(email, sender)).to.shallowDeepEqual(expectedEmail);
      });

      it('should: 1- add FROM to the TO field, 2- remove the sender from the recipient object if listed in TO or CC', function() {
        email = {
          to: [{displayName: 'sender', email: 'sender@linagora.com'}, {displayName: '2', email: '2@linagora.com'}],
          cc: [{displayName: '3', email: '3@linagora.com'}, {displayName: '4', email: '4@linagora.com'}],
          bcc: [{displayName: '5', email: '5@linagora.com'}, {displayName: '6', email: '6@linagora.com'}],
          from: {displayName: '0', email: '0@linagora.com'}
        };

        sender =  {displayName: 'sender', email: 'sender@linagora.com'};

        expectedEmail = {
          to: [{displayName: '2', email: '2@linagora.com'}, {displayName: '0', email: '0@linagora.com'}],
          cc: [{displayName: '3', email: '3@linagora.com'}, {displayName: '4', email: '4@linagora.com'}],
          bcc: [{displayName: '5', email: '5@linagora.com'}, {displayName: '6', email: '6@linagora.com'}]
        };

        expect(emailSendingService.getReplyAllRecipients(email, sender)).to.shallowDeepEqual(expectedEmail);

        email = {
          to: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}],
          cc: [{displayName: 'sender', email: 'sender@linagora.com'}, {displayName: '4', email: '4@linagora.com'}],
          bcc: [{displayName: '5', email: '5@linagora.com'}, {displayName: '6', email: '6@linagora.com'}],
          from: {displayName: '0', email: '0@linagora.com'}
        };

        sender =  {displayName: 'sender', email: 'sender@linagora.com'};

        expectedEmail = {
          to: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}, {displayName: '0', email: '0@linagora.com'}],
          cc: [{displayName: '4', email: '4@linagora.com'}],
          bcc: [{displayName: '5', email: '5@linagora.com'}, {displayName: '6', email: '6@linagora.com'}]
        };

        expect(emailSendingService.getReplyAllRecipients(email, sender)).to.shallowDeepEqual(expectedEmail);
      });

      it('should not add FROM to the TO filed if it represents the sender', function() {
        email = {
          to: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}],
          cc: [{displayName: '3', email: '3@linagora.com'}, {displayName: '4', email: '4@linagora.com'}],
          bcc: [{displayName: '5', email: '5@linagora.com'}, {displayName: '6', email: '6@linagora.com'}],
          from: {displayName: 'sender', email: 'sender@linagora.com'}
        };

        sender =  {displayName: 'sender', email: 'sender@linagora.com'};

        expectedEmail = {
          to: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}],
          cc: [{displayName: '3', email: '3@linagora.com'}, {displayName: '4', email: '4@linagora.com'}],
          bcc: [{displayName: '5', email: '5@linagora.com'}, {displayName: '6', email: '6@linagora.com'}]
        };

        expect(emailSendingService.getReplyAllRecipients(email, sender)).to.shallowDeepEqual(expectedEmail);
      });

      it('should not add FROM to the TO field if already there', function() {
        email = {
          to: [{ displayName: '1', email: '1@linagora.com' }, { displayName: '2', email: '2@linagora.com' }],
          from: { displayName: '1', email: '1@linagora.com' }
        };

        sender =  { displayName: 'sender', email: 'sender@linagora.com' };

        expectedEmail = {
          to: [{ displayName: '1', email: '1@linagora.com' }, { displayName: '2', email: '2@linagora.com' }],
          cc: [],
          bcc: []
        };

        expect(emailSendingService.getReplyAllRecipients(email, sender)).to.shallowDeepEqual(expectedEmail);
      });

      it('should leverage the replyTo filed instead of FROM (when provided)', function() {
        email = {
          to: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}],
          cc: [{displayName: '3', email: '3@linagora.com'}, {displayName: '4', email: '4@linagora.com'}],
          bcc: [{displayName: '5', email: '5@linagora.com'}, {displayName: '6', email: '6@linagora.com'}],
          from: {displayName: '0', email: '0@linagora.com'},
          replyTo: {displayName: 'replyToEmail', email: 'replyToEmail@linagora.com'}
        };

        sender =  {displayName: 'sender', email: 'sender@linagora.com'};

        expectedEmail = {
          to: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}, {displayName: 'replyToEmail', email: 'replyToEmail@linagora.com'}],
          cc: [{displayName: '3', email: '3@linagora.com'}, {displayName: '4', email: '4@linagora.com'}],
          bcc: [{displayName: '5', email: '5@linagora.com'}, {displayName: '6', email: '6@linagora.com'}]
        };

        expect(emailSendingService.getReplyAllRecipients(email, sender)).to.shallowDeepEqual(expectedEmail);
      });

      it('should not modify the BCC field even if the sender is listed inside', function() {
        email = {
          to: [{displayName: '2', email: '2@linagora.com'}],
          cc: [{displayName: '3', email: '3@linagora.com'}, {displayName: '4', email: '4@linagora.com'}],
          bcc: [{displayName: '5', email: '5@linagora.com'}, {displayName: '6', email: '6@linagora.com'}],
          from: {displayName: '0', email: '0@linagora.com'}
        };

        sender =  {displayName: 'sender', email: 'sender@linagora.com'};

        expectedEmail = {
          to: [{displayName: '2', email: '2@linagora.com'}, {displayName: '0', email: '0@linagora.com'}],
          cc: [{displayName: '3', email: '3@linagora.com'}, {displayName: '4', email: '4@linagora.com'}],
          bcc: [{displayName: '5', email: '5@linagora.com'}, {displayName: '6', email: '6@linagora.com'}]
        };

        expect(emailSendingService.getReplyAllRecipients(email, sender).bcc).to.shallowDeepEqual(expectedEmail.bcc);

        sender =  {displayName: '5', email: '5@linagora.com'};
        expect(emailSendingService.getReplyAllRecipients(email, sender).bcc).to.shallowDeepEqual(expectedEmail.bcc);
      });

      it('should remove the sender from the recipient object (the sender could be an EMailer or the logged-in User)', function() {
        email = {
          to: [{displayName: 'sender', email: 'sender@linagora.com'}, {displayName: '2', email: '2@linagora.com'}],
          cc: [{displayName: '3', email: '3@linagora.com'}, {displayName: '4', email: '4@linagora.com'}],
          bcc: [{displayName: '5', email: '5@linagora.com'}, {displayName: '6', email: '6@linagora.com'}],
          from: {displayName: '0', email: '0@linagora.com'}
        };

        sender =  {displayName: 'sender', email: 'sender@linagora.com'};

        expectedEmail = {
          to: [{displayName: '2', email: '2@linagora.com'}, {displayName: '0', email: '0@linagora.com'}],
          cc: [{displayName: '3', email: '3@linagora.com'}, {displayName: '4', email: '4@linagora.com'}],
          bcc: [{displayName: '5', email: '5@linagora.com'}, {displayName: '6', email: '6@linagora.com'}]
        };

        expect(emailSendingService.getReplyAllRecipients(email, sender)).to.shallowDeepEqual(expectedEmail);

        sender =  {displayName: 'sender', preferredEmail: 'sender@linagora.com'};
        expect(emailSendingService.getReplyAllRecipients(email, sender)).to.shallowDeepEqual(expectedEmail);
      });
    });

    describe('the getReplyRecipients function', function() {
      var email, sender, expectedEmail;
      it('should do nothing when email is not provided', function() {
        expect(emailSendingService.getReplyRecipients(null)).to.be.undefined;
      });

      it('should reply to FROM if FROM is not the sender', function() {
        email = {
          from: {displayName: '0', email: '0@linagora.com'}
        };

        sender =  {displayName: 'sender', email: 'sender@linagora.com'};

        expectedEmail = {
          to: [{displayName: '0', email: '0@linagora.com'}]
        };

        expect(emailSendingService.getReplyRecipients(email, sender)).to.shallowDeepEqual(expectedEmail);
      });

      it('should reply to ReplyTo if ReplyTo is not the sender', function() {
        email = {
          from: {displayName: '0', email: '0@linagora.com'},
          replyTo: {displayName: 'replyto', email: 'replyto@linagora.com'}
        };

        sender =  {displayName: 'sender', email: 'sender@linagora.com'};

        expectedEmail = {
          to: [{displayName: 'replyto', email: 'replyto@linagora.com'}]
        };

        expect(emailSendingService.getReplyRecipients(email, sender)).to.shallowDeepEqual(expectedEmail);
      });

    });

    describe('the createReplyAllEmailObject function', function() {
      var email, sender, expectedAnswer;

      it('should create a reply all email object', function(done) {
        email = {
          from: {email: 'sender@linagora.com', name: 'linagora'},
          to: [{displayName: '1', email: '1@linagora.com'}],
          cc: [{displayName: '2', email: '2@linagora.com'}],
          bcc: [{displayName: '3', email: '3@linagora.com'}],
          date: '12:00:00 14:00',
          subject: 'my subject',
          htmlBody: '<p>my body</p>'
        };
        sender =  {displayName: 'sender', email: 'sender@linagora.com'};
        expectedAnswer = {
          from: 'sender@linagora.com',
          to: [{displayName: '1', email: '1@linagora.com'}],
          cc: [{displayName: '2', email: '2@linagora.com'}],
          bcc: [{displayName: '3', email: '3@linagora.com'}],
          subject: 'Re: my subject'
        };

        emailSendingService.createReplyAllEmailObject(email, sender).then(function(email) {
          expect(email).to.shallowDeepEqual(expectedAnswer);
        }).then(done, done);

        $rootScope.$digest();
      });
    });

    describe('the createReplyEmailObject function', function() {
      var email, sender, expectedAnswer;

      it('should create a reply email object', function(done) {
        email = {
          from: {email: 'from@linagora.com', name: 'linagora'},
          to: [{displayName: '1', email: '1@linagora.com'}],
          cc: [{displayName: '2', email: '2@linagora.com'}],
          bcc: [{displayName: '3', email: '3@linagora.com'}],
          date: '12:00:00 14:00',
          subject: 'my subject',
          htmlBody: '<p>my body</p>'
        };
        sender =  {displayName: 'sender', email: 'sender@linagora.com'};
        expectedAnswer = {
          from: 'sender@linagora.com',
          to: [{email: 'from@linagora.com', name: 'linagora'}],
          subject: 'Re: my subject'
        };

        emailSendingService.createReplyEmailObject(email, sender).then(function(email) {
          expect(email).to.shallowDeepEqual(expectedAnswer);
        }).then(done, done);

        $rootScope.$digest();
      });
    });

    describe('the createForwardEmailObject function', function(done) {
      var email, sender, expectedAnswer;

      it('should create a forward email object', function() {
        email = {
          from: {email: 'from@linagora.com', name: 'from'},
          to: [{name: 'first', email: 'first@linagora.com'}, {name: 'second', email: 'second@linagora.com'}],
          cc: [{name: 'third', email: 'third@linagora.com'}],
          date: '12:00:00 14:00',
          subject: 'my subject',
          htmlBody: '<p>my body</p>'
        };
        sender =  {name: 'sender', email: 'sender@linagora.com'};
        expectedAnswer = {
          from: 'sender@linagora.com',
          subject: 'Fw: my subject',
          htmlBody: '<p><br/></p>' +
          '<cite>' +
          '------- Forwarded message -------<br/>' +
          'Subject: my subject<br/>' +
          'Date: 12:00:00 14:00<br/>' +
          'From: from@linagora.com<br/>' +
          'To: first &lt;first@linagora.com&gt;, second &lt;second@linagora.com&gt;<br/>' +
          'CC: third &lt;third@linagora.com&gt;' +
          '</cite>' +
          '<blockquote><p>my body</p></blockquote>'
        };

        emailSendingService.createForwardEmailObject(email, sender).then(function(email) {
          expect(email).to.shallowDeepEqual(expectedAnswer);
        }).then(done, done);

        $rootScope.$digest();
      });
    });
  });

  describe('The draftService service', function() {

    var draftService, session, notificationFactory, jmapClient, $log, $rootScope;

    beforeEach(module(function($provide) {
      jmapClient = {};
      $provide.constant('withJmapClient', function(callback) {
        return callback(jmapClient);
      });
    }));

    beforeEach(inject(function(_draftService_, _session_, _notificationFactory_, _$log_, _$rootScope_) {
      draftService = _draftService_;
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
          to: [{email: 'to@domain'}],
          cc: [{email: 'cc@domain'}],
          bcc: [{email: 'bcc@domain'}]
        });
        expect(draft.needToBeSaved({
          subject: 'yo',
          htmlBody: 'text',
          to: [{email: 'to@domain'}],
          cc: [{email: 'cc@domain'}],
          bcc: [{email: 'bcc@domain'}]
        })).to.equal(false);
      });

      it('should return false if only order changes', function() {
        var draft = draftService.startDraft({
          subject: 'yo',
          htmlBody: 'text',
          to: [{email: 'to1@domain'}, {email: 'to2@domain'}],
          cc: [{email: 'cc1@domain'}, {email: 'cc2@domain'}],
          bcc: [{email: 'bcc1@domain'}, {email: 'bcc2@domain'}]
        });
        expect(draft.needToBeSaved({
          subject: 'yo',
          htmlBody: 'text',
          to: [{email: 'to2@domain'}, {email: 'to1@domain'}],
          cc: [{email: 'cc2@domain'}, {email: 'cc1@domain'}],
          bcc: [{email: 'bcc1@domain'}, {email: 'bcc2@domain'}]
        })).to.equal(false);
      });

      it('should return false if only name has changed', function() {
        var draft = draftService.startDraft({
          subject: 'yo',
          htmlBody: 'text',
          to: [{email: 'to@domain', name:'before'}]
        });
        expect(draft.needToBeSaved({
          subject: 'yo',
          htmlBody: 'text',
          to: [{email: 'to@domain', name:'after'}]
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

      it('should return true if original has difference into recipients only', function() {
        var draft = draftService.startDraft({
          subject: 'yo',
          htmlBody: 'text',
          to: []
        });
        expect(draft.needToBeSaved({
          subject: 'yo',
          htmlBody: 'text',
          to: [{email: 'second@domain'}]
        })).to.equal(true);
      });

      it('should return true if new has difference into to recipients only', function() {
        var draft = draftService.startDraft({
          subject: 'yo',
          htmlBody: 'text',
          to: [{email: 'first@domain'}]
        });
        expect(draft.needToBeSaved({
          subject: 'yo',
          htmlBody: 'text',
          to: [{email: 'second@domain'}]
        })).to.equal(true);
      });

      it('should return true if new has difference into cc recipients only', function() {
        var draft = draftService.startDraft({
          subject: 'yo',
          htmlBody: 'text',
          cc: [{email: 'first@domain'}]
        });
        expect(draft.needToBeSaved({
          subject: 'yo',
          htmlBody: 'text',
          cc: [{email: 'second@domain'}]
        })).to.equal(true);
      });

      it('should return true if new has difference into bcc recipients only', function() {
        var draft = draftService.startDraft({
          subject: 'yo',
          htmlBody: 'text',
          bcc: [{email: 'first@domain'}]
        });
        expect(draft.needToBeSaved({
          subject: 'yo',
          htmlBody: 'text',
          bcc: [{email: 'second@domain'}]
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

      it('should return false if original has empty recipients property', function() {
        var draft = draftService.startDraft({
          subject: 'yo',
          htmlBody: 'text',
          to: []
        });
        expect(draft.needToBeSaved({
          subject: 'yo',
          htmlBody: 'text'
        })).to.equal(false);
      });

      it('should return false if new has empty recipients property', function() {
        var draft = draftService.startDraft({
          subject: 'yo',
          htmlBody: 'text'
        });
        expect(draft.needToBeSaved({
          subject: 'yo',
          htmlBody: 'text',
          to: []
        })).to.equal(false);
      });

    });

    describe('The save method', function() {

      it('should do nothing and return rejected promise if needToBeSaved returns false', function(done) {
        jmapClient.saveAsDraft = sinon.spy();
        var draft = draftService.startDraft({});
        draft.needToBeSaved = function() {return false;};

        draft.save({}).catch(function() {
          expect(jmapClient.saveAsDraft).to.not.have.been.called;
          done();
        });

        $rootScope.$digest();
      });

      it('should call saveAsDraft if needToBeSaved returns true', function(done) {
        jmapClient.saveAsDraft = sinon.stub().returns($q.when({}));
        var draft = draftService.startDraft({});
        draft.needToBeSaved = function() {return true;};

        draft.save({to: []}).then(function() {
          expect(jmapClient.saveAsDraft).to.have.been.called;
          done();
        });

        $rootScope.$digest();
      });

      it('should call saveAsDraft with OutboundMessage filled with properties', function() {
        jmapClient.saveAsDraft = sinon.stub().returns($q.when({}));
        session.user = {preferredEmail: 'yo@lo', name: 'me'};

        var draft = draftService.startDraft({});
        draft.needToBeSaved = function() {return true;};

        draft.save({
          subject: 'expected subject',
          htmlBody: 'expected htmlBody',
          to: [{email: 'to@domain', name: 'to'}],
          cc: [{email: 'cc@domain', name: 'cc'}],
          bcc: [{email: 'bcc@domain', name: 'bcc'}]
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
          to: [{email: 'to@domain', name: 'to', other: 'value'}],
          cc: [{email: 'cc@domain', name: 'cc'}, {email: 'cc2@domain', other: 'value', name: 'cc2'}]
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

        draft.save({to: []});

        $rootScope.$digest();
        expect(notificationFactory.weakInfo).to.have.been.called;
        expect(notificationFactory.weakInfo).to.have.been.calledWithExactly('Note', 'Your email has been saved as draft');
      });

      it('should notify when has not saved successfully', function(done) {
        var err = {message: 'rejected with err'};
        jmapClient.saveAsDraft = function() {return $q.reject(err);};
        notificationFactory.weakError = sinon.spy();
        $log.error = sinon.spy();

        var draft = draftService.startDraft({});
        draft.needToBeSaved = function() {return true;};

        draft.save({to: []}).catch(function(error) {
          expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Your email has not been saved');
          expect($log.error).to.have.been.calledWith('A draft has not been saved', err);
          expect(error).to.deep.equal(err);
          done();
        });

        $rootScope.$digest();
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

        expect($state.go).to.have.been.calledWith('unifiedinbox-compose', {email: undefined});
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

        expect($state.go).to.have.been.calledWith('unifiedinbox-compose', {email: {expected: 'field'}});
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

    describe('the "openEmailCustomTitle" method', function() {

      it('should delegate to screenSize to know if the size is "xs"', function(done) {
        screenSize.is = function(size) {
          expect(size).to.equal('xs');
          done();
        };
        newComposerService.openEmailCustomTitle('title', {id: 'value'});
      });

      it('should update the location with the email id if screenSize returns true', function() {
        screenSize.is = sinon.stub().returns(true);
        $state.go = sinon.spy();

        newComposerService.openEmailCustomTitle('title', {expected: 'field'});
        $timeout.flush();

        expect($state.go).to.have.been.calledWith('unifiedinbox-compose', {email: {expected: 'field'}});
      });

      it('should delegate to boxOverlayOpener if screenSize returns false', function() {
        screenSize.is = sinon.stub().returns(false);
        boxOverlayOpener.open = sinon.spy();

        newComposerService.openEmailCustomTitle('title', {email: 'object'});

        expect(boxOverlayOpener.open).to.have.been.calledWith({
          title: 'title',
          templateUrl: '/unifiedinbox/views/composer/box-compose.html',
          email: {email: 'object'}
        });
      });

    });

  });

  describe('The Composition factory', function() {

    var Composition, draftService, emailSendingService, session, $timeout, Offline,
        notificationFactory, closeNotificationSpy, notificationTitle, notificationText,
        jmap;

    beforeEach(module(function($provide) {
      $provide.constant('withJmapClient', function() {});
    }));

    beforeEach(inject(function(_draftService_, _notificationFactory_, _session_, _Offline_,
         _Composition_, _emailSendingService_, _$timeout_, _jmap_) {
      draftService = _draftService_;
      notificationFactory = _notificationFactory_;
      session = _session_;
      Offline = _Offline_;
      Composition = _Composition_;
      emailSendingService = _emailSendingService_;
      $timeout = _$timeout_;
      jmap = _jmap_;

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

      expect(result).to.deep.equal({
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

      expect(result).to.deep.equal({
        to: [{name: undefined, email: '1@linagora.com', displayName: '1@linagora.com'}],
        cc: [{name: undefined, email: '2@linagora.com', displayName: '2@linagora.com'}],
        bcc: [{name: undefined, email: '3@linagora.com', displayName: '3@linagora.com'}]
      });
    });

    it('should start a draft when instantiated', function() {
      draftService.startDraft = sinon.spy();

      new Composition({obj: 'expected'});

      expect(draftService.startDraft).to.have.been
        .calledWith({ obj: 'expected', bcc: [], cc: [], to: [] });
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
        .calledWith({obj: 'expected', test: 'tested', bcc: [], cc: [], to: [] });
    });

    it('should not try to destroy the original draft, when saveDraft is called and the original is not a jmap.Message', function() {
      draftService.startDraft = function() {
        return {
          save: sinon.stub().returns($q.when({}))
        };
      };

      var message = { destroy: sinon.spy() };

      new Composition(message).saveDraft();
      $timeout.flush();

      expect(message.destroy).to.have.not.been.called;
    });

    it('should destroy the original draft when saveDraft is called, when the original is a jmap.Message', function() {
      draftService.startDraft = function() {
        return {
          save: sinon.stub().returns($q.when({}))
        };
      };

      var message = new jmap.Message(null, 'id', 'threadId', ['box1'], {
        to: [{displayName: '1', email: '1@linagora.com'}]
      });
      message.destroy = sinon.spy();

      new Composition(message).saveDraft();
      $timeout.flush();

      expect(message.destroy).to.have.been.calledOnce;
    });

    it('"canBeSentOrNotify" fn should returns false when the email has no recipient', function() {
      var email = {
        to: [],
        cc: [],
        bcc: []
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

      expect(emailSendingService.sendEmail).to.have.been.calledOnce;
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
        to: [{name: '1', displayName: '1', email: '1@linagora.com'}],
        cc: [],
        bcc: []
      });
    });

    it('"send" fn should not try to destroy the original message, when it is not a jmap.Message', function() {
      emailSendingService.sendEmail = sinon.stub().returns($q.when());

      var message = {
        destroy: sinon.spy(),
        to: [{displayName: '1', email: '1@linagora.com'}],
        type: 'is not jmap.Message as expected'
      };

      new Composition(message).send();
      $timeout.flush();

      expect(message.destroy).to.have.not.been.called;
    });

    it('"send" fn should destroy the original draft, when it is a jmap.Message', function() {
      emailSendingService.sendEmail = sinon.stub().returns($q.when());

      var message = new jmap.Message(null, 'id', 'threadId', ['box1'], {
        to: [{displayName: '1', email: '1@linagora.com'}]
      });
      message.destroy = sinon.spy();

      new Composition(message).send();
      $timeout.flush();

      expect(message.destroy).to.have.been.calledOnce;
    });

  });

  describe('The emailBodyService factory', function() {

    var emailBodyService, $rootScope, _, isMobile;

    beforeEach(module(function($provide) {
      isMobile = false;

      $provide.value('deviceDetector', {
        isMobile: function() { return isMobile; }
      });
      $provide.value('localTimezone', 'UTC');
    }));

    beforeEach(inject(function(_emailBodyService_, _$rootScope_, ___, $templateCache) {
      emailBodyService = _emailBodyService_;
      $rootScope = _$rootScope_;
      _ = ___;

      $templateCache.put('/unifiedinbox/views/partials/quotes/default.txt', 'On {{ email.date | date:dateFormat:tz }} from {{ email.from.email }}: {{ email.textBody }}');
      $templateCache.put('/unifiedinbox/views/partials/quotes/forward.txt',
        '------- Forwarded message ------- ' +
        'Subject: {{ email.subject }} ' +
        'Date: {{ email.date | date:dateFormat:tz }} ' +
        '{{ email.to | emailerList:"To: "}} ' +
        '{{ email.cc | emailerList:"CC: "}} ' +
        '{{ email.textBody }}');
    }));

    describe('The quote function', function() {

      var email = {
        from: {
          name: 'test',
          email: 'test@open-paas.org'
        },
        subject: 'Heya',
        date: '2015-08-21T00:10:00Z',
        textBody: 'TextBody',
        htmlBody: '<p>HtmlBody</p>'
      };

      it('should quote htmlBody using a richtext template if not on mobile', function(done) {
        emailBodyService.quote(email)
          .then(function(text) {
            expect(text).to.equal('<p><br/></p><cite>On Aug 21, 2015 12:10:00 AM, from test@open-paas.org</cite><blockquote><p>HtmlBody</p></blockquote>');
          })
          .then(done, done);

        $rootScope.$digest();
      });

      it('should quote textBody using a richtext template if not on mobile and htmlBody is not available', function(done) {
        emailBodyService.quote(_.omit(email, 'htmlBody'))
          .then(function(text) {
            expect(text).to.equal('<p><br/></p><cite>On Aug 21, 2015 12:10:00 AM, from test@open-paas.org</cite><blockquote>TextBody</blockquote>');
          })
          .then(done, done);

        $rootScope.$digest();
      });

      it('should quote textBody using a plaintext template if on mobile', function(done) {
        isMobile = true;
        emailBodyService.quote(email)
          .then(function(text) {
            expect(text).to.equal('On Aug 21, 2015 12:10:00 AM from test@open-paas.org: TextBody');
          })
          .then(done, done);

        $rootScope.$digest();
      });

      it('should leverage the rich mode of forward template if specified', function(done) {
        emailBodyService.quote(email, 'forward')
          .then(function(text) {
            expect(text).to.equal('<p><br/></p><cite>------- Forwarded message -------<br/>Subject: Heya<br/>Date: Aug 21, 2015 12:10:00 AM<br/>From: test@open-paas.org<br/><br/></cite><blockquote><p>HtmlBody</p></blockquote>');
          })
          .then(done, done);

        $rootScope.$digest();
      });

      it('should leverage the text mode of forward template if specified', function(done) {
        isMobile = true;
        emailBodyService.quote(email, 'forward')
          .then(function(text) {
            expect(text).to.equal('------- Forwarded message ------- Subject: Heya Date: Aug 21, 2015 12:10:00 AM   TextBody');
          })
          .then(done, done);

        $rootScope.$digest();
      });

    });

    describe('The supportsRichtext function', function() {

      it('is true when deviceDetector.isMobile()=false', function() {
        expect(emailBodyService.supportsRichtext()).to.equal(true);
      });

      it('is false when deviceDetector.isMobile()=true', function() {
        isMobile = true;
        expect(emailBodyService.supportsRichtext()).to.equal(false);
      });

    });

  });

  describe('The mailboxesService factory', function() {

    var mailboxesService, jmapClient, $rootScope;

    beforeEach(module(function($provide) {
      jmapClient = {
        getMailboxes: function() { return $q.when([]); }
      };

      $provide.value('withJmapClient', function(callback) { return callback(jmapClient); });
    }));

    beforeEach(inject(function(_mailboxesService_, _$rootScope_) {
      mailboxesService = _mailboxesService_;
      $rootScope = _$rootScope_;
    }));

    describe('The filterSystemMailboxes function', function() {

      it('should filter mailboxes with a known role', function() {
        var mailboxes = [
          { id: 1, role: { value: 'inbox' } },
          { id: 2, role: { } },
          { id: 3, role: { value: null } },
          { id: 4, role: { value: 'outbox' } }
        ];
        var expected = [
          { id: 2, role: { } },
          { id: 3, role: { value: null } }
        ];

        expect(mailboxesService.filterSystemMailboxes(mailboxes)).to.deep.equal(expected);
      });

      it('should return an empty array if an empty array is given', function() {
        expect(mailboxesService.filterSystemMailboxes([])).to.deep.equal([]);
      });

      it('should return an empty array if nothing is given', function() {
        expect(mailboxesService.filterSystemMailboxes()).to.deep.equal([]);
      });

    });

    describe('The assignMailboxesList function', function() {

      it('should return a promise', function(done) {
        mailboxesService.assignMailboxesList().then(function(mailboxes) {
          expect(mailboxes).to.deep.equal([]);

          done();
        });

        $rootScope.$digest();
      });

      it('should assign dst.mailboxes if dst is given', function(done) {
        var object = {};

        mailboxesService.assignMailboxesList(object).then(function(mailboxes) {
          expect(object.mailboxes).to.deep.equal([]);

          done();
        });

        $rootScope.$digest();
      });

      it('should assign dst.mailboxes if dst is given and dst.mailboxes does not exist yet', function(done) {
        var object = { mailboxes: 'Yolo' };

        mailboxesService.assignMailboxesList(object).then(function(mailboxes) {
          expect(object.mailboxes).to.equal('Yolo');

          done();
        });

        $rootScope.$digest();
      });

      it('should filter mailboxes using a filter, if given', function(done) {
        jmapClient.getMailboxes = function() {
          return $q.when([{}, {}, {}]);
        };
        mailboxesService.assignMailboxesList(null, function(mailboxes) {
          return mailboxes.slice(0, 1);
        }).then(function(mailboxes) {
          expect(mailboxes).to.have.length(1);

          done();
        });

        $rootScope.$digest();
      });

      it('should add level and qualifiedName properties to mailboxes', function() {
        jmapClient.getMailboxes = function() {
          return $q.when([
            { id: 1, name: '1' },
            { id: 2, name: '2', parentId: 1 },
            { id: 3, name: '3', parentId: 2 },
            { id: 4, name: '4' },
            { id: 5, name: '5', parentId: 1 }
          ]);
        };
        var expected = [
          { id: 1, name: '1', level: 1, qualifiedName: '1' },
          { id: 2, name: '2', parentId: 1, level: 2, qualifiedName: '1 / 2' },
          { id: 3, name: '3', parentId: 2, level: 3, qualifiedName: '1 / 2 / 3' },
          { id: 4, name: '4', level: 1, qualifiedName: '4' },
          { id: 5, name: '5', parentId: 1, level: 2, qualifiedName: '1 / 5' }
        ];

        mailboxesService.assignMailboxesList().then(function(mailboxes) {
          expect(mailboxes).to.deep.equal(expected);
        });
      });

    });

  });

  describe('The asyncAction factory', function() {

    var asyncAction, notificationFactory, notification, $rootScope;

    function qNoop() {
      return $q.when();
    }

    beforeEach(module(function($provide) {
      notification = {
        close: sinon.spy()
      };
      notificationFactory = {
        strongInfo: sinon.spy(function() { return notification; }),
        weakSuccess: sinon.spy(),
        weakError: sinon.spy()
      };

      $provide.value('notificationFactory', notificationFactory);
    }));

    beforeEach(inject(function(_asyncAction_, _$rootScope_) {
      asyncAction = _asyncAction_;
      $rootScope = _$rootScope_;
    }));

    it('should start the action', function() {
      var action = sinon.spy(qNoop);

      asyncAction('Test', action);
      $rootScope.$digest();

      expect(action).to.have.been.calledWith();
    });

    it('should notify strongInfo when starting the action', function() {
      asyncAction('Test', qNoop);
      $rootScope.$digest();

      expect(notificationFactory.strongInfo).to.have.been.calledWith('', 'Test in progress...');
    });

    it('should close the strongInfo notification when action resolves', function() {
      asyncAction('Test', qNoop);
      $rootScope.$digest();

      expect(notification.close).to.have.been.calledWith();
    });

    it('should close the strongInfo notification when action rejects', function() {
      asyncAction('Test', function() { return $q.reject(); });
      $rootScope.$digest();

      expect(notification.close).to.have.been.calledWith();
    });

    it('should notify weakSuccess when action resolves', function() {
      asyncAction('Test', qNoop);
      $rootScope.$digest();

      expect(notificationFactory.weakSuccess).to.have.been.calledWith('', 'Test succeeded');
    });

    it('should notify weakError when action rejects', function() {
      asyncAction('Test', function() { return $q.reject(); });
      $rootScope.$digest();

      expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Test failed');
    });

    it('should return a promise resolving to the resolved value of the action', function(done) {
      asyncAction('Test', function() { return $q.when(1); })
        .then(function(result) {
          expect(result).to.equal(1);

          done();
        });

      $rootScope.$digest();
    });

    it('should return a promise rejecting with the rejection value of the action', function(done) {
      asyncAction('Test', function() { return $q.reject('Bouh !'); })
        .then(function() {
          done('The promise should not be resolved !');
        }, function(result) {
          expect(result).to.equal('Bouh !');

          done();
        });

      $rootScope.$digest();
    });

  });

  describe('The asyncJmapAction factory', function() {

    var asyncJmapAction, asyncAction, withJmapClient;

    beforeEach(module(function($provide) {
      $provide.value('asyncAction', sinon.spy(function(message, action) { return action(); }));
      $provide.value('withJmapClient', sinon.spy(function(callback) { return callback; }));
    }));

    beforeEach(inject(function(_asyncJmapAction_, _asyncAction_, _withJmapClient_) {
      asyncAction = _asyncAction_;
      withJmapClient = _withJmapClient_;
      asyncJmapAction = _asyncJmapAction_;
    }));

    it('should delegate to asyncAction, forwarding the message and the wrapped action', function() {
      asyncJmapAction('Message', 1);

      expect(withJmapClient).to.have.been.calledWith(1);
      expect(asyncAction).to.have.been.calledWith('Message', sinon.match.func);
    });

  });

});
