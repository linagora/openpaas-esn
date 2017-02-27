'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The Unified Inbox Angular module services', function() {

  var attendeeService, isMobile, config;

  beforeEach(function() {
    angular.mock.module('esn.jmap-client-wrapper');
    angular.mock.module('esn.session');
    angular.mock.module('esn.core');
    angular.mock.module('linagora.esn.unifiedinbox');
    angular.mock.module('jadeTemplates');
  });

  beforeEach(module(function($provide) {
    isMobile = false;
    config = config || {};

    $provide.value('localTimezone', 'UTC');
    $provide.value('attendeeService', attendeeService = { addProvider: angular.noop });
    $provide.value('deviceDetector', {
      isMobile: function() {
        return isMobile;
      }
    });
    $provide.value('esnConfig', function(key, defaultValue) {
      return $q.when(angular.isDefined(config[key]) ? config[key] : defaultValue);
    });
  }));

  afterEach(function() {
    config = {};
  });

  describe('The inboxConfig factory', function() {

    var $rootScope, inboxConfig;

    function checkValue(key, defaultValue, expected, done) {
      inboxConfig(key, defaultValue).then(function(value) {
        expect(value).to.equal(expected);

        done();
      }, done);

      $rootScope.$digest();
    }

    beforeEach(inject(function(_$rootScope_, _inboxConfig_) {
      inboxConfig = _inboxConfig_;
      $rootScope = _$rootScope_;

      config['linagora.esn.unifiedinbox.testKey'] = 'testValue';
    }));

    it('should delegate to esnConfig, prefixing the key with the module name', function(done) {
      checkValue('testKey', undefined, 'testValue', done);
    });

    it('should delegate to esnConfig with default value, prefixing the key with the module name', function(done) {
      checkValue('not.existing', 'abc', 'abc', done);
    });

  });

  describe('The generateJwtToken service', function() {

    var $httpBackend, generateJwtToken;
    beforeEach(angular.mock.inject(function(_$httpBackend_, _generateJwtToken_) {
      $httpBackend = _$httpBackend_;
      generateJwtToken = _generateJwtToken_;
    }));

    it('should resolve response data on success', function(done) {
      var responseData = { key: 'value' };
      $httpBackend.expectPOST('/api/jwt/generate').respond(200, responseData);
      generateJwtToken().then(function(data) {
        expect(data).to.deep.equal(responseData);
        done();
      }, done.bind(null, 'should resolve'));
      $httpBackend.flush();
    });

    it('should reject error response on failure', function(done) {
      $httpBackend.expectPOST('/api/jwt/generate').respond(500);
      generateJwtToken().then(done.bind(null, 'should reject'), function(err) {
        expect(err.status).to.equal(500);
        done();
      });
      $httpBackend.flush();
    });

  });

  describe('The jmapClientProvider service', function() {

    var $rootScope, jmapClientProvider, jmap;

    function injectServices() {
      angular.mock.inject(function(_$rootScope_, _jmapClientProvider_, _jmap_) {
        $rootScope = _$rootScope_;
        jmapClientProvider = _jmapClientProvider_;
        jmap = _jmap_;
      });
    }

    it('should return a rejected promise if jwt generation fails', function(done) {
      var error = new Error('error message');

      angular.mock.module(function($provide) {
        $provide.value('generateJwtToken', function() {
          return $q.reject(error);
        });
      });
      injectServices.bind(this)();

      jmapClientProvider.get().then(done.bind(null, 'should reject'), function(err) {
        expect(err.message).to.equal(error.message);

        done();
      });
      $rootScope.$digest();
    });

    it('should return a fulfilled promise if jwt generation succeed', function(done) {
      angular.mock.module(function($provide) {
        $provide.value('generateJwtToken', function() {
          return $q.when('expected jwt');
        });
      });
      config['linagora.esn.unifiedinbox.api'] = 'expected jmap api';
      config['linagora.esn.unifiedinbox.downloadUrl'] = 'expected jmap downloadUrl';
      injectServices.bind(this)();

      jmapClientProvider.get().then(function(client) {
        expect(client).to.be.an.instanceof(jmap.Client);
        expect(client.authToken).to.equal('Bearer expected jwt');
        expect(client.apiUrl).to.equal('expected jmap api');
        expect(client.downloadUrl).to.equal('expected jmap downloadUrl');

        done();
      }, done.bind(null, 'should resolve'));
      $rootScope.$digest();
    });

  });

  describe('The withJmapClient factory', function() {

    var $rootScope, withJmapClient;
    var jmapClientProviderMock;

    beforeEach(function() {
      jmapClientProviderMock = {};
      angular.mock.module(function($provide) {
        $provide.value('jmapClientProvider', jmapClientProviderMock);
      });
      angular.mock.inject(function(_$rootScope_, _withJmapClient_) {
        withJmapClient = _withJmapClient_;
        $rootScope = _$rootScope_;
      });
    });

    it('should give the client in the callback when jmapClientProvider resolves', function(done) {
      var jmapClient = { send: angular.noop };
      jmapClientProviderMock.get = function() { return $q.when(jmapClient); };

      withJmapClient(function(client) {
        expect(client).to.deep.equal(jmapClient);

        done();
      });
      $rootScope.$digest();
    });

    it('should resolve the callback with a null instance and an error when jmapClient cannot be built', function(done) {
      jmapClientProviderMock.get = function() { return $q.reject(new Error()); };

      withJmapClient(function(client, err) {
        expect(client).to.equal(null);
        expect(err).to.be.an.instanceOf(Error);

        done();
      });
      $rootScope.$digest();
    });

    it('should reject if the callback promise rejects', function(done) {
      jmapClientProviderMock.get = function() { return $q.when({}); };
      var e = new Error('error message');
      withJmapClient(function() {
        return $q.reject(e);
      }).then(done.bind(null, 'should reject'), function(err) {
        expect(err.message).to.equal(e.message);

        done();
      });

      $rootScope.$digest();
    });

  });

  describe('The sendEmail service', function() {

    var $httpBackend, $rootScope, jmap, sendEmail, backgroundProcessorService, jmapClientMock;

    beforeEach(function() {
      jmapClientMock = {};

      angular.mock.module(function($provide) {
        $provide.value('withJmapClient', function(callback) {
          return callback(jmapClientMock);
        });
      });

      angular.mock.inject(function(_$httpBackend_, _$rootScope_, _jmap_, _sendEmail_, _backgroundProcessorService_) {
        $httpBackend = _$httpBackend_;
        $rootScope = _$rootScope_;
        jmap = _jmap_;
        sendEmail = _sendEmail_;
        backgroundProcessorService = _backgroundProcessorService_;
      });

    });

    it('should be called as a background task', function() {
      sinon.spy(backgroundProcessorService, 'add');
      $httpBackend.expectPOST('/unifiedinbox/api/inbox/sendemail').respond(200);

      sendEmail({});
      $httpBackend.flush();

      expect(backgroundProcessorService.add).to.have.been.calledOnce;
    });

    describe('Use SMTP', function() {

      beforeEach(function() {
        config['linagora.esn.unifiedinbox.isJmapSendingEnabled'] = false;
      });

      it('should use SMTP to send email when JMAP is not enabled to send email', function() {
        $httpBackend.expectPOST('/unifiedinbox/api/inbox/sendemail').respond(200);
        sendEmail({});
        $httpBackend.flush();
      });

      it('should resolve response on success', function(done) {
        var data = { key: 'data' };
        $httpBackend.expectPOST('/unifiedinbox/api/inbox/sendemail').respond(200, data);
        sendEmail({}).then(function(resp) {
          expect(resp.data).to.deep.equal(data);
          done();
        }, done.bind(null, 'should resolve'));
        $httpBackend.flush();
      });

      it('should reject error response on failure', function(done) {
        $httpBackend.expectPOST('/unifiedinbox/api/inbox/sendemail').respond(500);
        sendEmail({}).then(done.bind(null, 'should reject'), function(err) {
          expect(err.status).to.equal(500);
          done();
        });
        $httpBackend.flush();
      });

    });

    describe('Use JMAP', function() {
      beforeEach(function() {
        config['linagora.esn.unifiedinbox.isJmapSendingEnabled'] = true;
        config['linagora.esn.unifiedinbox.isSaveDraftBeforeSendingEnabled'] = true;

        jmapClientMock.saveAsDraft = function() {
          return $q.when({});
        };

        jmapClientMock.getMailboxWithRole = function() {
          return $q.when({});
        };

        jmapClientMock.moveMessage = function() {
          return $q.when({});
        };

      });

      it('should use JMAP to send email when JMAP is enabled to send email', function(done) {
        var email = { from: { email: 'A' }, to: [{ email: 'B' }] };
        var messageAck = { id: 'm123' };
        var outbox = { id: 't456' };

        jmapClientMock.saveAsDraft = function() {
          return $q.when(messageAck);
        };

        jmapClientMock.getMailboxWithRole = function(role) {
          expect(role).to.equal(jmap.MailboxRole.OUTBOX);
          return $q.when(outbox);
        };

        jmapClientMock.moveMessage = function(messageId, mailboxIds) {
          expect(messageId).to.equal(messageAck.id);
          expect(mailboxIds).to.deep.equal([outbox.id]);
        };

        sendEmail(email).then(done.bind(null, null), done.bind(null, 'should resolve'));
        $rootScope.$digest();
      });

      it('should reject if JMAP client fails to save email as draft', function(done) {
        var error = new Error('error message');
        jmapClientMock.saveAsDraft = function() {
          return $q.reject(error);
        };

        sendEmail({}).then(done.bind(null, 'should reject'), function(err) {
          expect(err.message).to.equal(error.message);
          done();
        });
        $rootScope.$digest();
      });

      it('should reject if JMAP client fails to get outbox mailbox', function(done) {
        var error = new Error('error message');
        jmapClientMock.getMailboxWithRole = function() {
          return $q.reject(error);
        };

        sendEmail({}).then(done.bind(null, 'should reject'), function(err) {
          expect(err.message).to.equal(error.message);
          done();
        });
        $rootScope.$digest();
      });

      it('should reject if JMAP client fails to move message to outbox mailbox', function(done) {
        var error = new Error('error message');
        jmapClientMock.moveMessage = function() {
          return $q.reject(error);
        };

        sendEmail({}).then(done.bind(null, 'should reject'), function(err) {
          expect(err.message).to.equal(error.message);
          done();
        });
        $rootScope.$digest();
      });

    });

    describe('Use JMAP but without saving a draft', function() {

      var email;

      beforeEach(function() {
        email = { to: [{ email: 'B' }] };
        config['linagora.esn.unifiedinbox.isJmapSendingEnabled'] = true;
        config['linagora.esn.unifiedinbox.isSaveDraftBeforeSendingEnabled'] = false;
      });

      it('should use JMAP to send email when JMAP is enabled to send email', function(done) {
        jmapClientMock.send = sinon.stub().returns($q.when('expected return'));

        sendEmail(email).then(function(returnedValue) {
          expect(jmapClientMock.send).to.have.been.calledWithMatch({ to: [{ email: 'B', name: '' }]});
          expect(returnedValue).to.equal('expected return');
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should reject if JMAP client send fails', function(done) {
        var error = new Error('error message');

        jmapClientMock.send = sinon.stub().returns($q.reject(error));

        sendEmail(email).then(null).then(done.bind(null, 'should reject'), function(err) {
          expect(err).to.deep.equal(error);
          done();
        });

        $rootScope.$digest();
      });

    });

  });

  describe('The jmapHelper service', function() {

    var jmapHelper, jmap, emailBodyServiceMock, $rootScope, notificationFactory, jmapClient;

    beforeEach(function() {
      angular.mock.module(function($provide) {
        jmapClient = {};

        $provide.value('withJmapClient', function(callback) {
          return callback(jmapClient);
        });
        $provide.value('emailBodyService', emailBodyServiceMock = { bodyProperty: 'htmlBody' });
      });

      angular.mock.inject(function(session, _$rootScope_, _jmapHelper_, _notificationFactory_, _jmap_) {
        jmapHelper = _jmapHelper_;
        jmap = _jmap_;
        $rootScope = _$rootScope_;
        notificationFactory = _notificationFactory_;

        notificationFactory.weakError = sinon.spy();

        session.user = {
          firstname: 'Alice',
          lastname: 'Cooper',
          preferredEmail: 'alice@domain'
        };
      });
    });

    describe('The getMessageById function', function() {

      it('should fetch the message, and reject upon failure', function(done) {
        jmapClient.getMessages = function(options) {
          expect(options.ids).to.deep.equal(['id']);

          return $q.reject();
        };

        jmapHelper.getMessageById('id').then(null, done);
        $rootScope.$digest();
      });

      it('should fetch the message, and return it upon success', function(done) {
        jmapClient.getMessages = function(options) {
          expect(options.ids).to.deep.equal(['id']);

          return $q.when([{ id: 'id' }]);
        };

        jmapHelper.getMessageById('id').then(function(message) {
          expect(message).to.deep.equal({ id: 'id' });

          done();
        });
        $rootScope.$digest();
      });

    });

    describe('The toOutboundMessage fn', function() {

      it('should build and return new instance of jmap.OutboundMessage', function() {
        expect(jmapHelper.toOutboundMessage({}, {
          subject: 'expected subject',
          htmlBody: 'expected htmlBody',
          to: [{email: 'to@domain', name: 'to'}],
          cc: [{email: 'cc@domain', name: 'cc'}],
          bcc: [{email: 'bcc@domain', name: 'bcc'}]
        })).to.deep.equal(new jmap.OutboundMessage({}, {
          from: new jmap.EMailer({
            name: 'Alice Cooper',
            email: 'alice@domain'
          }),
          subject: 'expected subject',
          htmlBody: 'expected htmlBody',
          to: [{email: 'to@domain', name: 'to'}],
          cc: [{email: 'cc@domain', name: 'cc'}],
          bcc: [{email: 'bcc@domain', name: 'bcc'}]
        }));
      });

      it('should filter attachments with no blobId', function() {
        expect(jmapHelper.toOutboundMessage({}, {
          htmlBody: 'expected htmlBody',
          attachments: [{ blobId: '1' }, { blobId: '' }]
        })).to.deep.equal(new jmap.OutboundMessage({}, {
          from: new jmap.EMailer({
            name: 'Alice Cooper',
            email: 'alice@domain'
          }),
          htmlBody: 'expected htmlBody',
          to: [],
          cc: [],
          bcc: [],
          attachments: [new jmap.Attachment({}, '1')]
        }));
      });

      it('should include email.htmlBody when provided', function() {
        emailBodyServiceMock.bodyProperty = 'textBody';

        var message = jmapHelper.toOutboundMessage({}, {
          htmlBody: 'expected htmlBody',
          textBody: 'expected textBody'
        });

        expect(message.htmlBody).to.equal('expected htmlBody');
        expect(message.textBody).to.be.null;
      });

      it('should leverage emailBodyServiceMock.bodyProperty when emailState.htmlBody is undefined', function() {
        emailBodyServiceMock.bodyProperty = 'textBody';

        var message = jmapHelper.toOutboundMessage({}, {
          htmlBody: '',
          textBody: 'expected textBody'
        });

        expect(message.htmlBody).to.be.null;
        expect(message.textBody).to.equal('expected textBody');
      });
    });

  });

  describe('The emailSendingService factory', function() {
    var emailSendingService, email, $rootScope, jmapClient;

    beforeEach(function() {
      jmapClient = {};

      angular.mock.module(function($provide) {
        $provide.value('sendEmail', angular.noop);
        $provide.value('withJmapClient', function(callback) {
          return callback(jmapClient);
        });
      });

      angular.mock.inject(function(_emailSendingService_, _$rootScope_) {
        emailSendingService = _emailSendingService_;
        $rootScope = _$rootScope_;
      });
    });

    describe('The noRecipient function', function() {
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

    describe('The countRecipients function', function() {

      it('should return 0 when no email is given', function() {
        expect(emailSendingService.countRecipients()).to.equal(0);
      });

      it('should ignore undefined recipient groups', function() {
        expect(emailSendingService.countRecipients({})).to.equal(0);
      });

      it('should count recipients in "To", "CC" and "BCC"', function() {
        expect(emailSendingService.countRecipients({
          to: [{ email: '1' }, { email: '2' }],
          cc: [{ email: '3' }],
          bcc: [{ email: '4' }, { email: '5' }, { email: '6' }, { email: '7' }]
        })).to.equal(7);
      });

    });

    describe('The emailsAreValid function', function() {
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

    describe('The removeDuplicateRecipients function', function() {
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

    describe('The prefixSubject function', function() {

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

    describe('The showReplyAllButton function', function() {
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

    describe('The getReplyAllRecipients function', function() {
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

        sender = {displayName: 'sender', email: 'sender@linagora.com'};

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

        sender = {displayName: 'sender', email: 'sender@linagora.com'};

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

        sender = {displayName: 'sender', email: 'sender@linagora.com'};

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

        sender = {displayName: 'sender', email: 'sender@linagora.com'};

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

        sender = { displayName: 'sender', email: 'sender@linagora.com' };

        expectedEmail = {
          to: [{ displayName: '1', email: '1@linagora.com' }, { displayName: '2', email: '2@linagora.com' }],
          cc: [],
          bcc: []
        };

        expect(emailSendingService.getReplyAllRecipients(email, sender)).to.shallowDeepEqual(expectedEmail);
      });

      it('should leverage the replyTo field instead of FROM (when provided)', function() {
        email = {
          to: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}],
          cc: [{displayName: '3', email: '3@linagora.com'}, {displayName: '4', email: '4@linagora.com'}],
          bcc: [{displayName: '5', email: '5@linagora.com'}, {displayName: '6', email: '6@linagora.com'}],
          from: {displayName: '0', email: '0@linagora.com'},
          replyTo: [{displayName: 'replyToEmail', email: 'replyToEmail@linagora.com'}]
        };

        sender = {displayName: 'sender', email: 'sender@linagora.com'};

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

        sender = {displayName: 'sender', email: 'sender@linagora.com'};

        expectedEmail = {
          to: [{displayName: '2', email: '2@linagora.com'}, {displayName: '0', email: '0@linagora.com'}],
          cc: [{displayName: '3', email: '3@linagora.com'}, {displayName: '4', email: '4@linagora.com'}],
          bcc: [{displayName: '5', email: '5@linagora.com'}, {displayName: '6', email: '6@linagora.com'}]
        };

        expect(emailSendingService.getReplyAllRecipients(email, sender).bcc).to.shallowDeepEqual(expectedEmail.bcc);

        sender = {displayName: '5', email: '5@linagora.com'};
        expect(emailSendingService.getReplyAllRecipients(email, sender).bcc).to.shallowDeepEqual(expectedEmail.bcc);
      });

      it('should remove the sender from the recipient object (the sender could be an EMailer or the logged-in User)', function() {
        email = {
          to: [{displayName: 'sender', email: 'sender@linagora.com'}, {displayName: '2', email: '2@linagora.com'}],
          cc: [{displayName: '3', email: '3@linagora.com'}, {displayName: '4', email: '4@linagora.com'}],
          bcc: [{displayName: '5', email: '5@linagora.com'}, {displayName: '6', email: '6@linagora.com'}],
          from: {displayName: '0', email: '0@linagora.com'}
        };

        sender = {displayName: 'sender', email: 'sender@linagora.com'};

        expectedEmail = {
          to: [{displayName: '2', email: '2@linagora.com'}, {displayName: '0', email: '0@linagora.com'}],
          cc: [{displayName: '3', email: '3@linagora.com'}, {displayName: '4', email: '4@linagora.com'}],
          bcc: [{displayName: '5', email: '5@linagora.com'}, {displayName: '6', email: '6@linagora.com'}]
        };

        expect(emailSendingService.getReplyAllRecipients(email, sender)).to.shallowDeepEqual(expectedEmail);

        sender = {displayName: 'sender', preferredEmail: 'sender@linagora.com'};
        expect(emailSendingService.getReplyAllRecipients(email, sender)).to.shallowDeepEqual(expectedEmail);
      });
    });

    describe('The getReplyRecipients function', function() {
      var email, expectedEmail;

      it('should do nothing when email is not provided', function() {
        expect(emailSendingService.getReplyRecipients(null)).to.be.undefined;
      });

      it('should reply to FROM if ReplyTo is not present', function() {
        email = {
          from: {displayName: '0', email: '0@linagora.com'}
        };

        expectedEmail = {
          to: [{displayName: '0', email: '0@linagora.com'}]
        };

        expect(emailSendingService.getReplyRecipients(email)).to.shallowDeepEqual(expectedEmail);
      });

      it('should reply to ReplyTo if ReplyTo is present', function() {
        email = {
          from: {displayName: '0', email: '0@linagora.com'},
          replyTo: [{displayName: 'replyto', email: 'replyto@linagora.com'}]
        };

        expectedEmail = {
          to: [{displayName: 'replyto', email: 'replyto@linagora.com'}]
        };

        expect(emailSendingService.getReplyRecipients(email)).to.shallowDeepEqual(expectedEmail);
      });

      it('should reply to ReplyTo if ReplyTo is present, filtering out unknown EMailers', function() {
        email = {
          from: {displayName: '0', email: '0@linagora.com'},
          replyTo: [{displayName: 'replyto', email: 'replyto@linagora.com'}, { email: '@' }, { name: 'second', email: 'second@linagora.com' }]
        };

        expectedEmail = {
          to: [{displayName: 'replyto', email: 'replyto@linagora.com'}, { name: 'second', email: 'second@linagora.com' }]
        };

        expect(emailSendingService.getReplyRecipients(email)).to.shallowDeepEqual(expectedEmail);
      });

    });

    function mockGetMessages(message) {
      jmapClient.getMessages = function() {
        return $q.when([message]);
      };
    }

    describe('The createReplyAllEmailObject function', function() {
      var email, sender, expectedAnswer;

      it('should create a reply all email object, quoting the original message on desktop', function(done) {
        email = {
          from: {email: 'sender@linagora.com', name: 'linagora'},
          to: [{displayName: '1', email: '1@linagora.com'}],
          cc: [{displayName: '2', email: '2@linagora.com'}],
          bcc: [{displayName: '3', email: '3@linagora.com'}],
          date: '12:00:00 14:00',
          subject: 'my subject',
          htmlBody: '<p>my body</p>'
        };
        sender = {displayName: 'sender', email: 'sender@linagora.com'};
        expectedAnswer = {
          from: 'sender@linagora.com',
          to: [{displayName: '1', email: '1@linagora.com'}],
          cc: [{displayName: '2', email: '2@linagora.com'}],
          bcc: [{displayName: '3', email: '3@linagora.com'}],
          subject: 'Re: my subject',
          quoted: email,
          quoteTemplate: 'default',
          isQuoting: true
        };

        mockGetMessages(email);
        emailSendingService.createReplyAllEmailObject('id', sender).then(function(email) {
          expect(email).to.shallowDeepEqual(expectedAnswer);
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should create a reply all email object, not quoting the original message on mobile', function(done) {
        isMobile = true;
        email = {
          from: {email: 'sender@linagora.com', name: 'linagora'},
          to: [{displayName: '1', email: '1@linagora.com'}],
          cc: [{displayName: '2', email: '2@linagora.com'}],
          bcc: [{displayName: '3', email: '3@linagora.com'}],
          date: '12:00:00 14:00',
          subject: 'my subject',
          htmlBody: '<p>my body</p>'
        };
        sender = {displayName: 'sender', email: 'sender@linagora.com'};
        expectedAnswer = {
          from: 'sender@linagora.com',
          to: [{displayName: '1', email: '1@linagora.com'}],
          cc: [{displayName: '2', email: '2@linagora.com'}],
          bcc: [{displayName: '3', email: '3@linagora.com'}],
          subject: 'Re: my subject',
          quoted: email,
          quoteTemplate: 'default',
          isQuoting: false
        };

        mockGetMessages(email);
        emailSendingService.createReplyAllEmailObject('id', sender).then(function(email) {
          expect(email).to.shallowDeepEqual(expectedAnswer);
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should not include attachments in the replayAll email', function(done) {
        email = {
          from: {email: 'from@linagora.com', name: 'linagora'},
          attachments: [{attachment: 'A'}, {attachment: 'B'}]
        };

        sender = {displayName: 'sender', email: 'sender@linagora.com'};

        mockGetMessages(email);
        emailSendingService.createReplyAllEmailObject('id', sender).then(function(email) {
          expect(email.attachments).to.be.undefined;
        }).then(done, done);

        $rootScope.$digest();
      });

    });

    describe('The createReplyEmailObject function', function() {
      var email, sender, expectedAnswer;

      it('should create a reply email object, quoting the original message on desktop', function(done) {
        email = {
          from: {email: 'from@linagora.com', name: 'linagora'},
          to: [{displayName: '1', email: '1@linagora.com'}],
          cc: [{displayName: '2', email: '2@linagora.com'}],
          bcc: [{displayName: '3', email: '3@linagora.com'}],
          date: '12:00:00 14:00',
          subject: 'my subject',
          htmlBody: '<p>my body</p>'
        };
        sender = {displayName: 'sender', email: 'sender@linagora.com'};
        expectedAnswer = {
          from: 'sender@linagora.com',
          to: [{email: 'from@linagora.com', name: 'linagora'}],
          subject: 'Re: my subject',
          quoted: email,
          quoteTemplate: 'default',
          isQuoting: true
        };

        mockGetMessages(email);
        emailSendingService.createReplyEmailObject('id', sender).then(function(email) {
          expect(email).to.shallowDeepEqual(expectedAnswer);
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should create a reply email object, not quoting the original message on mobile', function(done) {
        isMobile = true;
        email = {
          from: {email: 'from@linagora.com', name: 'linagora'},
          to: [{displayName: '1', email: '1@linagora.com'}],
          cc: [{displayName: '2', email: '2@linagora.com'}],
          bcc: [{displayName: '3', email: '3@linagora.com'}],
          date: '12:00:00 14:00',
          subject: 'my subject',
          htmlBody: '<p>my body</p>'
        };
        sender = {displayName: 'sender', email: 'sender@linagora.com'};
        expectedAnswer = {
          from: 'sender@linagora.com',
          to: [{email: 'from@linagora.com', name: 'linagora'}],
          subject: 'Re: my subject',
          quoted: email,
          quoteTemplate: 'default',
          isQuoting: false
        };

        mockGetMessages(email);
        emailSendingService.createReplyEmailObject('id', sender).then(function(email) {
          expect(email).to.shallowDeepEqual(expectedAnswer);
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should not include attachments in the replay email', function(done) {
        email = {
          attachments: [{attachment: 'A'}, {attachment: 'B'}]
        };

        mockGetMessages(email);
        emailSendingService.createReplyEmailObject('id', sender).then(function(email) {
          expect(email.attachments).to.be.undefined;
        }).then(done, done);

        $rootScope.$digest();
      });

    });

    describe('The createForwardEmailObject function', function(done) {
      var email, sender, expectedAnswer;

      it('should create a forward email object, quoting the original message on desktop', function() {
        email = {
          from: {email: 'from@linagora.com', name: 'from'},
          to: [{name: 'first', email: 'first@linagora.com'}, {name: 'second', email: 'second@linagora.com'}],
          cc: [{name: 'third', email: 'third@linagora.com'}],
          date: '12:00:00 14:00',
          subject: 'my subject',
          htmlBody: '<p>my body</p>'
        };
        sender = {name: 'sender', email: 'sender@linagora.com'};
        expectedAnswer = {
          from: 'sender@linagora.com',
          subject: 'Fwd: my subject',
          htmlBody: '<p><br/></p>' +
          '<cite>' +
          '------- Forwarded message -------<br/>' +
          'Subject: my subject<br/>' +
          'Date: 12:00:00 14:00<br/>' +
          'From: from@linagora.com<br/>' +
          'To: first &lt;first@linagora.com&gt;, second &lt;second@linagora.com&gt;<br/>' +
          'CC: third &lt;third@linagora.com&gt;' +
          '</cite>' +
          '<blockquote><p>my body</p></blockquote>',
          quoted: email,
          quoteTemplate: 'forward',
          isQuoting: true
        };

        mockGetMessages(email);
        emailSendingService.createForwardEmailObject('id', sender).then(function(email) {
          expect(email).to.shallowDeepEqual(expectedAnswer);
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should create a forward email object, not quoting the original message on mobile', function() {
        isMobile = true;
        email = {
          from: {email: 'from@linagora.com', name: 'from'},
          to: [{name: 'first', email: 'first@linagora.com'}, {name: 'second', email: 'second@linagora.com'}],
          cc: [{name: 'third', email: 'third@linagora.com'}],
          date: '12:00:00 14:00',
          subject: 'my subject',
          htmlBody: '<p>my body</p>'
        };
        sender = {name: 'sender', email: 'sender@linagora.com'};
        expectedAnswer = {
          from: 'sender@linagora.com',
          subject: 'Fwd: my subject',
          quoted: email,
          quoteTemplate: 'forward',
          isQuoting: false
        };

        mockGetMessages(email);
        emailSendingService.createForwardEmailObject('id', sender).then(function(email) {
          expect(email).to.shallowDeepEqual(expectedAnswer);
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should include attachments in the forwarded email', function() {
        email = {
          attachments: [{attachment: 'A'}, {attachment: 'B'}]
        };

        mockGetMessages(email);
        emailSendingService.createForwardEmailObject('id', sender).then(function(email) {
          expect(email.attachments).to.shallowDeepEqual([{attachment: 'A'}, {attachment: 'B'}]);
        }).then(done, done);

        $rootScope.$digest();
      });

    });
  });

  describe('The draftService service', function() {

    var draftService, session, notificationFactory, jmapClient, emailBodyService, $rootScope;

    beforeEach(module(function($provide) {
      jmapClient = {};
      notificationFactory = {
        strongInfo: sinon.stub().returns({ close: angular.noop }),
        weakError: sinon.spy(),
        weakSuccess: sinon.spy()
      };
      emailBodyService = {
        bodyProperty: 'htmlBody'
      };

      $provide.value('notificationFactory', notificationFactory);
      $provide.constant('withJmapClient', function(callback) {
        return callback(jmapClient);
      });
      $provide.value('emailBodyService', emailBodyService);
    }));

    beforeEach(inject(function(_draftService_, _session_, _$rootScope_) {
      draftService = _draftService_;
      session = _session_;
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
          to: [{email: 'to@domain', name: 'before'}]
        });
        expect(draft.needToBeSaved({
          subject: 'yo',
          htmlBody: 'text',
          to: [{email: 'to@domain', name: 'after'}]
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

      it('should return true if an attachment is added', function() {
        var draft = draftService.startDraft({
          subject: 'yo',
          htmlBody: 'text'
        });
        expect(draft.needToBeSaved({
          subject: 'yo',
          htmlBody: 'text',
          attachments: [{blobId: '1'}]
        })).to.equal(true);
      });

      it('should return true if new has difference into attachments', function() {
        var draft = draftService.startDraft({
          subject: 'yo',
          htmlBody: 'text',
          attachments: [{blobId: '1'}]
        });
        expect(draft.needToBeSaved({
          subject: 'yo',
          htmlBody: 'text',
          attachments: [{blobId: '1'}, {blobId: '2'}]
        })).to.equal(true);
      });

      it('should not compare attributes that are not definied in ATTACHMENTS_ATTRIBUTES', function() {
        var draft = draftService.startDraft({
          subject: 'yo',
          htmlBody: 'text',
          attachments: [{blobId: '1', name: 'name 1'}, {blobId: '2', name: 'name 2'}]
        });
        expect(draft.needToBeSaved({
          subject: 'yo',
          htmlBody: 'text',
          attachments: [{blobId: '1', name: 'name 1'}, {blobId: '2', name: 'name 2', notTested: 'notTested'}]
        })).to.equal(false);
      });

      it('should compare attributes that are definied in ATTACHMENTS_ATTRIBUTES', function() {
        var draft = draftService.startDraft({
          subject: 'yo',
          htmlBody: 'text',
          attachments: [{blobId: '1', name: 'name 1'}, {blobId: '2', name: 'name 2'}]
        });
        expect(draft.needToBeSaved({
          subject: 'yo',
          htmlBody: 'text',
          attachments: [{blobId: '1', name: 'name 1'}, {blobId: '2', name: 'name 2', size: 'new size'}]
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

      it('should return false if composing an email from scratch on mobile, and body is empty', function() {
        emailBodyService.bodyProperty = 'textBody';

        expect(draftService.startDraft({
          to: [{ email: 'a@a.com' }],
          subject: 'subject'
        }).needToBeSaved({
          to: [{ email: 'a@a.com' }],
          subject: 'subject',
          textBody: ''
        })).to.equal(false);
      });

      it('should return false if composing an email from an existing draft on mobile, and body has not changed', function() {
        emailBodyService.bodyProperty = 'textBody';

        expect(draftService.startDraft({
          to: [{ email: 'a@a.com' }],
          subject: 'subject',
          textBody: 'body'
        }).needToBeSaved({
          to: [{ email: 'a@a.com' }],
          subject: 'subject',
          textBody: 'body'
        })).to.equal(false);
      });

      it('should return false if composing an email from scratch on desktop, and body is empty', function() {
        expect(draftService.startDraft({
          to: [{ email: 'a@a.com' }],
          subject: 'subject'
        }).needToBeSaved({
          to: [{ email: 'a@a.com' }],
          subject: 'subject',
          htmlBody: ''
        })).to.equal(false);
      });

      it('should return false if composing an email from an existing draft on desktop, and body is empty', function() {
        expect(draftService.startDraft({
          to: [{ email: 'a@a.com' }],
          subject: 'subject',
          htmlBody: '<p>body</p>'
        }).needToBeSaved({
          to: [{ email: 'a@a.com' }],
          subject: 'subject',
          htmlBody: '<p>body</p>'
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
        session.user = {
          firstname: 'me',
          lastname: 'me',
          preferredEmail: 'yo@lo'
        };

        draftService.startDraft({}).save({
          subject: 'expected subject',
          htmlBody: 'expected htmlBody',
          to: [{email: 'to@domain', name: 'to'}],
          cc: [{email: 'cc@domain', name: 'cc'}],
          bcc: [{email: 'bcc@domain', name: 'bcc'}]
        });
        $rootScope.$digest();

        expect(jmapClient.saveAsDraft).to.have.been.calledWithMatch(
          sinon.match({
            from: {email: 'yo@lo', name: 'me me'},
            subject: 'expected subject',
            htmlBody: 'expected htmlBody',
            to: [{email: 'to@domain', name: 'to'}],
            cc: [{email: 'cc@domain', name: 'cc'}],
            bcc: [{email: 'bcc@domain', name: 'bcc'}]
          }));
      });

      it('should map all recipients to name-email tuple', function() {
        jmapClient.saveAsDraft = sinon.stub().returns($q.when({}));
        session.user = {
          firstname: 'me',
          lastname: 'me',
          preferredEmail: 'yo@lo'
        };

        draftService.startDraft({}).save({
          subject: 'expected subject',
          htmlBody: 'expected htmlBody',
          to: [{email: 'to@domain', name: 'to', other: 'value'}],
          cc: [{email: 'cc@domain', name: 'cc'}, {email: 'cc2@domain', other: 'value', name: 'cc2'}]
        });
        $rootScope.$digest();

        expect(jmapClient.saveAsDraft).to.have.been.calledWithMatch(
          sinon.match({
            from: {email: 'yo@lo', name: 'me me'},
            subject: 'expected subject',
            htmlBody: 'expected htmlBody',
            to: [{email: 'to@domain', name: 'to'}],
            cc: [{email: 'cc@domain', name: 'cc'}, {email: 'cc2@domain', name: 'cc2'}]
          }));
      });

      it('should notify when has saved successfully', function() {
        jmapClient.saveAsDraft = function() {return $q.when({});};

        var draft = draftService.startDraft({});
        draft.needToBeSaved = function() {return true;};

        draft.save({to: []});

        $rootScope.$digest();
        expect(notificationFactory.weakSuccess).to.have.been.calledWithExactly('', 'Saving your email as draft succeeded');
      });

      it('should notify when has not saved successfully', function(done) {
        var err = {message: 'rejected with err'};
        jmapClient.saveAsDraft = function() {return $q.reject(err);};

        var draft = draftService.startDraft({});
        draft.needToBeSaved = function() {return true;};

        draft.save({to: []}).catch(function(error) {
          expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Saving your email as draft failed');
          expect(error).to.deep.equal(err);
          done();
        });

        $rootScope.$digest();
      });

    });

    describe('The destroy method', function() {

      it('should do nothing when the draft has been created from an object', function(done) {
        draftService.startDraft({}).destroy().then(done);

        $rootScope.$digest();
      });

      it('should call client.destroyMessage when the draft has an ID', function() {
        jmapClient.destroyMessage = sinon.stub().returns($q.when());

        draftService.startDraft({
          id: 'the id',
          htmlBody: 'Body'
        }).destroy();

        $rootScope.$digest();
        expect(jmapClient.destroyMessage).to.have.been.calledWith('the id');
      });

    });

  });

  describe('The newComposerService ', function() {

    var $rootScope, $state, $timeout, newComposerService, deviceDetector, boxOverlayOpener;

    beforeEach(module(function($provide) {
      $provide.value('withJmapClient', function(callback) {
        return callback({
          getMessages: function() {
            return $q.when([{ id: 'id' }]);
          }
        }, { url: 'http://jmap' });
      });
    }));

    beforeEach(inject(function(_$rootScope_, _$state_, _$timeout_, _newComposerService_, _deviceDetector_, _boxOverlayOpener_) {
      $rootScope = _$rootScope_;
      newComposerService = _newComposerService_;
      deviceDetector = _deviceDetector_;
      $state = _$state_;
      $timeout = _$timeout_;
      boxOverlayOpener = _boxOverlayOpener_;
    }));

    beforeEach(function() {
      $state.current = {
        name: 'stateName'
      };
      $state.params = 'stateParams';
      $state.go = sinon.spy();
    });

    afterEach(function() {
      $('.box-overlay-open').remove();
    });

    describe('The "open" method', function() {

      it('should delegate to deviceDetector to know if the device is mobile or not', function(done) {
        deviceDetector.isMobile = done;
        newComposerService.open();
      });

      it('should update the location if deviceDetector returns true', function() {
        deviceDetector.isMobile = sinon.stub().returns(true);

        newComposerService.open();
        $timeout.flush();

        expect($state.go).to.have.been.calledWith('unifiedinbox.compose', {
          email: undefined,
          compositionOptions: undefined
        });
      });

      it('should delegate to boxOverlayOpener if deviceDetector returns false', function() {
        deviceDetector.isMobile = sinon.stub().returns(false);
        boxOverlayOpener.open = sinon.spy();

        newComposerService.open();

        expect(boxOverlayOpener.open).to.have.been.calledWithMatch({
          title: 'New message',
          templateUrl: '/unifiedinbox/views/composer/box-compose.html'
        });
      });

    });

    describe('The "openDraft" method', function() {

      it('should delegate to deviceDetector to know if device is mobile or not', function(done) {
        deviceDetector.isMobile = done;

        newComposerService.openDraft('id');
        $rootScope.$digest();
      });

      it('should update the location with the email id if deviceDetector returns true', function() {
        deviceDetector.isMobile = sinon.stub().returns(true);
        $state.go = sinon.spy();

        newComposerService.openDraft('id');
        $rootScope.$digest();

        expect($state.go).to.have.been.calledWith('unifiedinbox.compose', {
          email: { id: 'id' },
          compositionOptions: undefined
        });
      });

      it('should delegate to boxOverlayOpener if deviceDetector returns false', function() {
        deviceDetector.isMobile = sinon.stub().returns(false);
        boxOverlayOpener.open = sinon.spy();

        newComposerService.openDraft('id');
        $rootScope.$digest();

        expect(boxOverlayOpener.open).to.have.been.calledWith({
          id: 'id',
          title: 'New message',
          templateUrl: '/unifiedinbox/views/composer/box-compose.html',
          email: { id: 'id' },
          compositionOptions: undefined
        });
      });

      it('should not open twice the same draft on desktop', function() {
        deviceDetector.isMobile = sinon.stub().returns(false);

        newComposerService.openDraft('id');
        newComposerService.openDraft('id');
        $rootScope.$digest();

        expect($('.box-overlay-open').length).to.equal(1);
      });

    });

    describe('The "openEmailCustomTitle" method', function() {

      it('should delegate to deviceDetector to know if the device is mobile', function(done) {
        deviceDetector.isMobile = done;
        newComposerService.open({id: 'value'}, 'title');
      });

      it('should update the location with the email id if deviceDetector returns true', function() {
        deviceDetector.isMobile = sinon.stub().returns(true);

        newComposerService.open({expected: 'field'});
        $timeout.flush();

        expect($state.go).to.have.been.calledWith('unifiedinbox.compose', {
          email: {expected: 'field'},
          compositionOptions: undefined
        });
      });

      it('should delegate to boxOverlayOpener if deviceDetector returns false', function() {
        deviceDetector.isMobile = sinon.stub().returns(false);
        boxOverlayOpener.open = sinon.spy();

        newComposerService.open({ id: '1234', subject: 'object' });

        expect(boxOverlayOpener.open).to.have.been.calledWith({
          id: '1234',
          templateUrl: '/unifiedinbox/views/composer/box-compose.html',
          email: { id: '1234', subject: 'object' },
          title: 'New message',
          compositionOptions: undefined
        });
      });

      it('should use the email subject when opening an existing message', function() {
        deviceDetector.isMobile = sinon.stub().returns(false);
        boxOverlayOpener.open = sinon.spy();

        newComposerService.open({ id: '1234', subject: 'object' });

        expect(boxOverlayOpener.open).to.have.been.calledWith({
          id: '1234',
          title: 'New message',
          templateUrl: '/unifiedinbox/views/composer/box-compose.html',
          email: { id: '1234', subject: 'object' },
          compositionOptions: undefined
        });
      });

      it('should forward the compositionOptions when "open" is called and is on mobile', function() {
        deviceDetector.isMobile = sinon.stub().returns(true);

        newComposerService.open({expected: 'field'}, {expected: 'options'});
        $timeout.flush();

        expect($state.go).to.have.been.calledWith('unifiedinbox.compose', {
          email: {expected: 'field'},
          compositionOptions: {expected: 'options'}
        });
      });

      it('should forward the compositionOptions when "open" is called and is not on mobile', function() {
        deviceDetector.isMobile = sinon.stub().returns(false);
        boxOverlayOpener.open = sinon.spy();

        newComposerService.open({id: '1234', subject: 'object'}, {expected: 'options'});

        expect(boxOverlayOpener.open).to.have.been.calledWith({
          id: '1234',
          templateUrl: '/unifiedinbox/views/composer/box-compose.html',
          email: {id: '1234', subject: 'object'},
          compositionOptions: {expected: 'options'},
          title: 'New message'
        });
      });

    });

  });

  describe('The Composition factory', function() {

    var Composition, draftService, emailSendingService, $timeout, Offline,
        notificationFactory, jmap, jmapClient, firstSaveAck, $rootScope, newComposerService,
        gracePeriodService, graceRequestResult;

    beforeEach(module(function($provide) {
      config['linagora.esn.unifiedinbox.drafts'] = true;

      jmapClient = {
        destroyMessage: sinon.spy(function() { return $q.when(); }),
        saveAsDraft: sinon.spy(function() {
          return $q.when(firstSaveAck = new jmap.CreateMessageAck(jmapClient, {
            id: 'expected id',
            blobId: 'any',
            size: 5
          }));
        })
      };

      graceRequestResult = {
        cancelled: true,
        success: sinon.spy()
      };

      gracePeriodService = {
        askUserForCancel: sinon.spy(function() {
          return {promise: $q.when(graceRequestResult)};
        })
      };

      $provide.value('withJmapClient', function(callback) {
        return callback(jmapClient);
      });
      $provide.value('gracePeriodService', gracePeriodService);
    }));

    beforeEach(inject(function(_draftService_, _notificationFactory_, _Offline_,
         _Composition_, _emailSendingService_, _$timeout_, _jmap_, _$rootScope_, _newComposerService_) {
      draftService = _draftService_;
      notificationFactory = _notificationFactory_;
      Offline = _Offline_;
      Composition = _Composition_;
      emailSendingService = _emailSendingService_;
      $timeout = _$timeout_;
      jmap = _jmap_;
      $rootScope = _$rootScope_;
      newComposerService = _newComposerService_;

      Offline.state = 'up';

      emailSendingService.sendEmail = sinon.stub().returns($q.when());

      notificationFactory.weakSuccess = sinon.spy(notificationFactory.weakSuccess);
      notificationFactory.weakError = sinon.spy(notificationFactory.weakError);
      notificationFactory.strongInfo = sinon.spy(notificationFactory.strongInfo);
    }));

    it('should create empty recipient array when instantiated with none', function() {
      var result = new Composition({}).getEmail();

      expect(result).to.shallowDeepEqual({
        to: [],
        cc: [],
        bcc: []
      });
    });

    it('should start a draft when instantiated', function() {
      draftService.startDraft = sinon.spy();

      new Composition({ subject: 'subject' });

      expect(draftService.startDraft).to.have.been.calledWith(sinon.match({ subject: 'subject' }));
    });

    function expectEmailAfterSaveAsDraft(email, returnedMessage) {
      email.id = 'expected id';

      expect(returnedMessage).to.deep.equal(email);
    }

    function saveDraftTest(compositionMethod, done) {
      var composition = new Composition({});

      composition.email.htmlBody = 'modified';
      composition.email.to.push({email: '1@linagora.com'});

      composition[compositionMethod]().then(function(message) {
        expectEmailAfterSaveAsDraft(composition.email, message);
        expect(jmapClient.saveAsDraft.getCall(0).args[0]).to.shallowDeepEqual({
          htmlBody: 'modified',
          to: [{email: '1@linagora.com'}],
          bcc: [], cc: []
        });
      }).then(done, done);
      $timeout.flush();
    }

    it('should not save the draft when drafts is false', function(done) {
      config['linagora.esn.unifiedinbox.drafts'] = false;

      var composition = new Composition({});

      composition.email.htmlBody = 'modified';
      composition.email.to.push({email: '1@linagora.com'});

      composition.saveDraft().then(done.bind(null, 'should not resolved'), function() {
        expect(jmapClient.saveAsDraft).to.not.have.been.called;

        done();
      });

      $timeout.flush();
    });

    it('should save the draft when saveDraft is called', function(done) {
      saveDraftTest('saveDraft', done);
    });

    it('should save the draft silently when saveDraftSilently is called', function(done) {
      saveDraftTest('saveDraftSilently', done);
    });

    it('should renew the original jmap message with the ack id when saveDraft is called', function(done) {
      var message = new jmap.Message(jmapClient, 'not expected id', 'threadId', ['box1'], {});

      var composition = new Composition(message);

      composition.email.htmlBody = 'new content';

      composition.saveDraft().then(function() {
        expect(jmapClient.destroyMessage).to.have.been.calledWith('not expected id');
        expect(composition.draft.originalEmailState.id).to.equal('expected id');
      }).then(done, done);

      $timeout.flush();
    });

    it('should not save incomplete attachments in the drafts', function(done) {
      var composition = new Composition(new jmap.Message(jmapClient, 'not expected id', 'threadId', ['box1']));

      composition.email.attachments = [
        { blobId: '1', upload: { promise: $q.when() } },
        { blobId: '', upload: { promise: $q.when() } },
        { blobId: '2', upload: { promise: $q.when() } },
        { blobId: '', upload: { promise: $q.when() } }
      ];

      composition.saveDraft().then(function() {
        expect(jmapClient.saveAsDraft).to.have.been.calledWith(sinon.match({
          attachments: [new jmap.Attachment(jmapClient, '1'), new jmap.Attachment(jmapClient, '2')]
        }));
      }).then(done, done);

      $timeout.flush();
    });

    it('should renew the original jmap message with the second ack id when saveDraft is called twice, after the debouce delay', function(done) {
      var message = new jmap.Message(jmapClient, 'not expected id', 'threadId', ['box1'], {});

      message.destroy = sinon.stub().returns($q.when());
      var secondSaveAck = new jmap.CreateMessageAck(jmapClient, {
        id: 'another id',
        blobId: 'any',
        size: 5
      });

      var composition = new Composition(message);

      composition.email.htmlBody = 'new content';

      composition.saveDraft().then(function() {
        composition.email.htmlBody = 'content modified';
        jmapClient.saveAsDraft = sinon.stub().returns($q.when(secondSaveAck));
      });
      $timeout.flush();

      composition.saveDraft().then(function() {
        expect(jmapClient.destroyMessage).to.have.been.calledWith('expected id');
        expect(composition.draft.originalEmailState.id).to.equal('another id');
        expect(composition.draft.originalEmailState.htmlBody).to.equal('content modified');
      }).then(done, done);
      $timeout.flush();
    });

    it('should debouce multiple calls to saveDraftSilently', function(done) {
      var message = new jmap.Message(jmapClient, 'not expected id', 'threadId', ['box1'], {});

      var composition = new Composition(message);

      composition.email.htmlBody = 'content1';
      composition.saveDraftSilently();

      composition.email.htmlBody = 'content2';
      composition.saveDraftSilently();

      composition.email.htmlBody = 'content3';
      composition.saveDraftSilently().then(function() {
        expect(jmapClient.destroyMessage).to.have.been.calledWith('not expected id');
        expect(jmapClient.saveAsDraft).to.have.been.calledOnce;
        expect(composition.draft.originalEmailState.htmlBody).to.equal('content3');
      }).then(done, done);
      $timeout.flush();
    });

    it('should update the original message in the composition, with the email state used to save the draft', function(done) {
      var message = new jmap.Message(jmapClient, 'not expected id', 'threadId', ['box1'], {});

      message.destroy = sinon.stub().returns($q.when());

      var composition = new Composition(message);

      composition.email.htmlBody = 'saving body';
      composition.email.to = [{displayName: '1', email: 'saving@domain.org'}];

      jmapClient.saveAsDraft = sinon.spy(function() {
        composition.email.htmlBody = 'modified body since save has been called';
        composition.email.to.push({email: 'modified@domain.org'});

        return $q.when(firstSaveAck);
      });

      composition.saveDraft().then(function() {
        expect(composition.draft.originalEmailState.id).to.equal('expected id');
        expect(composition.draft.originalEmailState.htmlBody).to.equal('saving body');
        expect(composition.draft.originalEmailState.to).to.shallowDeepEqual([{email: 'saving@domain.org'}]);
      }).then(done, done);

      $timeout.flush();
    });

    it('"saveDraft" should cancel a delayed draft save', function(done) {
      var composition = new Composition(new jmap.Message(jmapClient, 'not expected id', 'threadId', ['box1'], {}));

      composition.email.subject = 'subject';

      jmapClient.saveAsDraft = sinon.spy(function() {
        return $q.when(firstSaveAck);
      });

      composition.saveDraftSilently();
      composition.saveDraft().then(function() {
        expect(jmapClient.saveAsDraft).to.have.been.calledOnce;

        done();
      });

      $timeout.flush();
    });

    it('"canBeSentOrNotify" fn should returns false when the email has no recipient', function() {
      var email = {
        to: [],
        cc: [],
        bcc: []
      };

      var result = new Composition(email).canBeSentOrNotify();

      expect(result).to.equal(false);
      expect(notificationFactory.weakError).to.have.been.calledWith('Note', 'Your email should have at least one recipient');
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
      expect(notificationFactory.weakError).to.have.been.calledWith('Note', 'Your device loses its Internet connection. Try later!');
    });

    it('"send" fn should successfully send an email even if only bcc is used', function() {
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

    it('"send" fn should not try to destroy the original message, when it is not a jmap.Message', function() {
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
      var message = new jmap.Message(null, 'id', 'threadId', ['box1'], {
        to: [{displayName: '1', email: '1@linagora.com'}]
      });

      new Composition(message).send();
      $timeout.flush();

      expect(jmapClient.destroyMessage).to.have.been.calledWith('id');
    });

    it('"send" fn should quote the original email if current email is not already quoting', function() {
      new Composition({
        to: [{ email: 'A@A.com' }],
        quoteTemplate: 'default',
        quoted: {
          from: {
            name: 'test',
            email: 'test@open-paas.org'
          },
          subject: 'Heya',
          date: '2015-08-21T00:10:00Z',
          htmlBody: '<p>HtmlBody</p>'
        }
      }).send();
      $rootScope.$digest();

      expect(emailSendingService.sendEmail).to.have.been.calledWith(sinon.match({
        htmlBody: '<pre></pre><br/><cite>On Aug 21, 2015 12:10:00 AM, from test@open-paas.org</cite><blockquote><p>HtmlBody</p></blockquote>'
      }));
    });

    it('"send" fn should not quote the original email if current email is already quoting', function() {
      new Composition({
        to: [{ email: 'A@A.com' }],
        quoteTemplate: 'default',
        textBody: 'Body',
        isQuoting: true,
        quoted: {
          from: {
            name: 'test',
            email: 'test@open-paas.org'
          },
          subject: 'Heya',
          date: '2015-08-21T00:10:00Z',
          htmlBody: '<p>HtmlBody</p>'
        }
      }).send();
      $rootScope.$digest();

      expect(emailSendingService.sendEmail).to.have.been.calledWith(sinon.match({
        textBody: 'Body',
        htmlBody: undefined
      }));
    });

    it('"send" fn should not quote the original email if there is no original email', function() {
      new Composition({
        to: [{ email: 'A@A.com' }],
        textBody: 'Body'
      }).send();
      $rootScope.$digest();

      expect(emailSendingService.sendEmail).to.have.been.calledWith(sinon.match({
        textBody: 'Body',
        htmlBody: undefined
      }));
    });

    it('"send" should cancel a delayed draft save', function(done) {
      var composition = new Composition(new jmap.Message(jmapClient, 'not expected id', 'threadId', ['box1'], {}));
      composition.email.subject = 'subject';

      jmapClient.saveAsDraft = sinon.spy();

      composition.saveDraftSilently();
      composition.send().then(function() {
        expect(emailSendingService.sendEmail).to.have.been.calledOnce;
        expect(jmapClient.saveAsDraft).to.have.not.been.calledWith();

        done();
      });

      $timeout.flush();
    });

    it('"send" fn should notify on success', function() {
      new Composition({
        destroy: angular.noop,
        to: [{displayName: '1', email: '1@linagora.com'}]
      }).send();
      $timeout.flush();

      expect(notificationFactory.weakSuccess).to.have.been.calledWith('', 'Message sent');
    });

    it('"send" fn should notify on failure', function() {
      emailSendingService.sendEmail = function() {
        return $q.reject();
      };

      new Composition({
        destroy: angular.noop,
        to: [{displayName: '1', email: '1@linagora.com'}]
      }).send();
      $timeout.flush();

      expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Your message cannot be sent');
    });

    it('"send" fn should notify on failure with a custom error message if the network connection is down', function() {
      emailSendingService.sendEmail = function() {
        Offline.state = 'down';

        return $q.reject();
      };

      new Composition({
        destroy: angular.noop,
        to: [{displayName: '1', email: '1@linagora.com'}]
      }).send();
      $timeout.flush();

      expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'You have been disconnected. Please check if the message was sent before retrying');
    });

    describe('The "destroyDraft" function', function() {

      it('should do nothing when drafts is false', function(done) {
        config['linagora.esn.unifiedinbox.drafts'] = false;

        new Composition({subject: 'a subject'}).destroyDraft().then(done.bind(null, 'should not resolved'), function() {
          expect(gracePeriodService.askUserForCancel).to.not.have.been.called;

          done();
        });

        $timeout.flush();
      });

      it('should generate expected notification when called', function(done) {
        new Composition({subject: 'a subject'}).destroyDraft().then(function() {
          expect(gracePeriodService.askUserForCancel).to.have.been.calledWith('This draft has been discarded', 'Reopen');
        }).then(done, done);

        $timeout.flush();
      });

      it('should not generate notification when called with empty email', function() {
        new Composition({}).destroyDraft();

        expect(gracePeriodService.askUserForCancel).to.have.not.been.called;
      });

      it('should destroy an existing draft even if email is empty', function(done) {
        var existingDraft = new jmap.Message(jmapClient, 123, 'threadId', ['box1'], { subject: 'a subject' }),
            composition = new Composition(existingDraft);

        composition.email.subject = '';

        composition.destroyDraft().then(function() {
          expect(jmapClient.destroyMessage).to.have.been.calledWith(123);

          done();
        });

        $timeout.flush();
      });

      it('should reopen the composer with the expected email when the grace period is cancelled', function(done) {
        var expectedEmail = { to: ['to@to'], cc: [], bcc: [], subject: 'expected subject', htmlBody: 'expected body', attachments: [] };
        newComposerService.open = sinon.spy();

        new Composition(expectedEmail).destroyDraft().then(function() {
          expect(newComposerService.open).to.have.been.calledWith(expectedEmail);
        }).then(done, done);

        $timeout.flush();
      });

      it('should perform draft saving when the composition has been modified, then restored, then saved', function(done) {
        var modifyingEmail = { to: [], cc: [], bcc: [], subject: 'original subject', htmlBody: '', attachments: [] };
        var expectedDraft = draftService.startDraft(angular.copy(modifyingEmail));
        newComposerService.open = sinon.spy();

        var composition = new Composition(modifyingEmail);
        composition.email.subject = modifyingEmail.subject = 'modified subject';

        composition.destroyDraft().then(function() {
          expect(newComposerService.open).to.have.been.calledWith(modifyingEmail, {
            fromDraft: expectedDraft
          });
        }).then(done, done);

        $timeout.flush();
      });

      it('should delete the original draft when the grace period is not cancelled', function(done) {
        var message = new jmap.Message(jmapClient, 123, 'threadId', ['box1'], {});
        graceRequestResult.cancelled = false;

        new Composition(message).destroyDraft().then(function() {
          expect(jmapClient.destroyMessage).to.have.been.calledWith(123);
        }).then(done, done);

        $timeout.flush();
      });

      it('should cancel the delayed save request', function() {
        var composition = new Composition();
        composition.email.htmlBody = 'content to save';

        composition.saveDraftSilently();
        composition.destroyDraft();

        $timeout.flush();
        expect(jmapClient.saveAsDraft).to.have.not.been.called;
      });

    });

  });

  describe('The emailBodyService factory', function() {

    var emailBodyService, $rootScope, _, isMobile;

    beforeEach(module(function($provide) {
      isMobile = false;

      $provide.value('deviceDetector', {
        isMobile: function() { return isMobile; }
      });
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

      it('should apply nl2br to original email textBody', function(done) {
        var email = {
          from: {
            name: 'test',
            email: 'test@open-paas.org'
          },
          subject: 'Heya',
          date: '2015-08-21T00:10:00Z',
          textBody: 'Text\nBody\nTest'
        };

        emailBodyService.quote(email)
          .then(function(text) {
            expect(text).to.equal('<p><br/></p><cite>On Aug 21, 2015 12:10:00 AM, from test@open-paas.org</cite><blockquote>Text<br/>Body<br/>Test</blockquote>');
          })
          .then(done, done);

        $rootScope.$digest();
      });

      it('should not apply nl2br to original email HTML body', function(done) {
        var email = {
          from: {
            name: 'test',
            email: 'test@open-paas.org'
          },
          subject: 'Heya',
          date: '2015-08-21T00:10:00Z',
          htmlBody: '<p><div>Test\nTest</div\n></p>'
        };

        emailBodyService.quote(email)
          .then(function(text) {
            expect(text).to.equal('<p><br/></p><cite>On Aug 21, 2015 12:10:00 AM, from test@open-paas.org</cite><blockquote><p><div>Test\nTest</div\n></p></blockquote>');
          })
          .then(done, done);

        $rootScope.$digest();
      });

      it('should apply nl2br to original email textBody, when forwarding', function(done) {
        var email = {
          from: {
            name: 'test',
            email: 'test@open-paas.org'
          },
          subject: 'Heya',
          date: '2015-08-21T00:10:00Z',
          textBody: 'Text\nBody\nTest'
        };

        emailBodyService.quote(email, 'forward')
          .then(function(text) {
            expect(text).to.equal('<p><br/></p><cite>------- Forwarded message -------<br/>Subject: Heya<br/>Date: Aug 21, 2015 12:10:00 AM<br/>From: test@open-paas.org<br/><br/></cite><blockquote>Text<br/>Body<br/>Test</blockquote>');
          })
          .then(done, done);

        $rootScope.$digest();
      });

      it('should not apply nl2br to original email HTML body, when forwarding', function(done) {
        var email = {
          from: {
            name: 'test',
            email: 'test@open-paas.org'
          },
          subject: 'Heya',
          date: '2015-08-21T00:10:00Z',
          htmlBody: '<p><div>Test\nTest</div\n></p>'
        };

        emailBodyService.quote(email, 'forward')
          .then(function(text) {
            expect(text).to.equal('<p><br/></p><cite>------- Forwarded message -------<br/>Subject: Heya<br/>Date: Aug 21, 2015 12:10:00 AM<br/>From: test@open-paas.org<br/><br/></cite><blockquote><p><div>Test\nTest</div\n></p></blockquote>');
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

    describe('The quoteOriginalEmail function', function() {

      var email;

      describe('With the "default" tempalte', function() {

        beforeEach(function() {
          email = {
            quoteTemplate: 'default',
            quoted: {
              from: {
                name: 'test',
                email: 'test@open-paas.org'
              },
              subject: 'Heya',
              date: '2015-08-21T00:10:00Z',
              htmlBody: '<p>HtmlBody</p>'
            }
          };
        });

        it('should quote the original email, using htmlBody when defined', function(done) {
          emailBodyService.quoteOriginalEmail(email)
            .then(function(text) {
              expect(text).to.equal('<pre></pre><br/><cite>On Aug 21, 2015 12:10:00 AM, from test@open-paas.org</cite><blockquote><p>HtmlBody</p></blockquote>');
            })
            .then(done, done);

          $rootScope.$digest();
        });

        it('should quote the original email, using textBody when htmlBody is not defined', function(done) {
          email.quoted.textBody = 'Hello';
          email.quoted.htmlBody = '';

          emailBodyService.quoteOriginalEmail(email)
            .then(function(text) {
              expect(text).to.equal('<pre></pre><br/><cite>On Aug 21, 2015 12:10:00 AM, from test@open-paas.org</cite><blockquote>Hello</blockquote>');
            })
            .then(done, done);

          $rootScope.$digest();
        });

        it('should quote the original email, keeping the already entered text when present', function(done) {
          email.textBody = 'I was previously typed';

          emailBodyService.quoteOriginalEmail(email)
            .then(function(text) {
              expect(text).to.equal('<pre>I was previously typed</pre><br/><cite>On Aug 21, 2015 12:10:00 AM, from test@open-paas.org</cite><blockquote><p>HtmlBody</p></blockquote>');
            })
            .then(done, done);

          $rootScope.$digest();
        });

      });

      describe('With the "forward" tempalte', function() {

        beforeEach(function() {
          email = {
            quoteTemplate: 'forward',
            quoted: {
              from: {
                name: 'test',
                email: 'test@open-paas.org'
              },
              subject: 'Heya',
              date: '2015-08-21T00:10:00Z',
              htmlBody: '<p>HtmlBody</p>'
            }
          };
        });

        it('should quote the original email, using htmlBody when defined', function(done) {
          emailBodyService.quoteOriginalEmail(email)
            .then(function(text) {
              expect(text).to.equal('<pre></pre><br/><cite>------- Forwarded message -------<br/>Subject: Heya<br/>Date: Aug 21, 2015 12:10:00 AM<br/>From: test@open-paas.org<br/><br/></cite><blockquote><p>HtmlBody</p></blockquote>');
            })
            .then(done, done);

          $rootScope.$digest();
        });

        it('should quote the original email, using textBody when htmlBody is not defined', function(done) {
          email.quoted.textBody = 'Hello';
          email.quoted.htmlBody = '';

          emailBodyService.quoteOriginalEmail(email)
            .then(function(text) {
              expect(text).to.equal('<pre></pre><br/><cite>------- Forwarded message -------<br/>Subject: Heya<br/>Date: Aug 21, 2015 12:10:00 AM<br/>From: test@open-paas.org<br/><br/></cite><blockquote>Hello</blockquote>');
            })
            .then(done, done);

          $rootScope.$digest();
        });

        it('should quote the original email, keeping the already entered text when present', function(done) {
          email.textBody = 'I was previously typed';

          emailBodyService.quoteOriginalEmail(email)
            .then(function(text) {
              expect(text).to.equal('<pre>I was previously typed</pre><br/><cite>------- Forwarded message -------<br/>Subject: Heya<br/>Date: Aug 21, 2015 12:10:00 AM<br/>From: test@open-paas.org<br/><br/></cite><blockquote><p>HtmlBody</p></blockquote>');
            })
            .then(done, done);

          $rootScope.$digest();
        });

      });

    });

  });

  describe('The mailboxesService factory', function() {

    var inboxMailboxesCache, mailboxesService, jmapClient, $rootScope, jmap, Mailbox, notificationFactory;

    beforeEach(module(function($provide) {
      jmapClient = {
        getMailboxes: function() { return $q.when([]); }
      };

      $provide.value('withJmapClient', function(callback) { return callback(jmapClient); });
      notificationFactory = {
        weakSuccess: sinon.spy(),
        weakError: sinon.spy(function() { return { setCancelAction: sinon.spy() }; }),
        strongInfo: sinon.spy(function() { return { close: sinon.spy() }; })
      };
      $provide.value('notificationFactory', notificationFactory);
    }));

    beforeEach(inject(function(_mailboxesService_, _$state_, _$rootScope_, _inboxMailboxesCache_, _jmap_, _Mailbox_, _notificationFactory_) {
      inboxMailboxesCache = _inboxMailboxesCache_;
      notificationFactory = _notificationFactory_;
      mailboxesService = _mailboxesService_;
      $rootScope = _$rootScope_;
      jmap = _jmap_;
      Mailbox = _Mailbox_;
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

    describe('The isRestrictedMailbox function', function() {

      it('should return true for restricted mailboxes', function() {
        expect(mailboxesService.isRestrictedMailbox({ role: { value: 'drafts' }})).to.equal(true);
        expect(mailboxesService.isRestrictedMailbox({ role: { value: 'outbox' }})).to.equal(true);
      });

      it('should return false for non restricted mailboxes', function() {
        expect(mailboxesService.isRestrictedMailbox({ role: { value: 'inbox' }})).to.equal(false);
        expect(mailboxesService.isRestrictedMailbox({ role: { value: undefined }})).to.equal(false);
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

        mailboxesService.assignMailboxesList(object).then(function() {
          expect(object.mailboxes).to.deep.equal([]);

          done();
        });

        $rootScope.$digest();
      });

      it('should assign dst.mailboxes if dst is given and dst.mailboxes does not exist yet', function(done) {
        var object = { mailboxes: 'Yolo' };

        mailboxesService.assignMailboxesList(object).then(function() {
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

      it('should add level and qualifiedName properties to mailboxes', function(done) {
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

          done();
        });

        $rootScope.$digest();
      });

      it('should not override mailboxes already present in cache', function(done) {
        inboxMailboxesCache[0] = { id: 2, name: '2', level: 2, parentId: 1, qualifiedName: '1 / 2' };
        jmapClient.getMailboxes = function() {
          return $q.when([
            { id: 1, name: '1' },
            { id: 4, name: '4' }
          ]);
        };
        var expected = [
          { id: 2, name: '2', level: 2, parentId: 1, qualifiedName: '1 / 2' },
          { id: 1, name: '1', level: 1, qualifiedName: '1' },
          { id: 4, name: '4', level: 1, qualifiedName: '4' }
        ];

        mailboxesService.assignMailboxesList().then(function(mailboxes) {
          expect(mailboxes).to.deep.equal(expected);

          done();
        });
        $rootScope.$digest();
      });

    });

    describe('The flagIsUnreadChanged function', function() {

      it('should do nothing if mail is undefined', function() {
        inboxMailboxesCache[0] = { id: 1, name: '1', unreadMessages: 1};

        mailboxesService.flagIsUnreadChanged();

        expect(inboxMailboxesCache[0].unreadMessages).to.equal(1);
      });

      it('should do nothing if status is undefined', function() {
        inboxMailboxesCache[0] = { id: 1, name: '1', unreadMessages: 1};

        mailboxesService.flagIsUnreadChanged({ mailboxIds: [1] });

        expect(inboxMailboxesCache[0].unreadMessages).to.equal(1);
      });

      it('should increase the unreadMessages in the mailboxesCache if status=true', function() {
        inboxMailboxesCache[0] = { id: 1, name: '1', unreadMessages: 1};

        mailboxesService.flagIsUnreadChanged({ mailboxIds: [1] }, true);

        expect(inboxMailboxesCache[0].unreadMessages).to.equal(2);
      });

      it('should decrease the unreadMessages in the mailboxesCache if status=false', function() {
        inboxMailboxesCache[0] = { id: 1, name: '1', unreadMessages: 1};

        mailboxesService.flagIsUnreadChanged({ mailboxIds: [1] }, false);

        expect(inboxMailboxesCache[0].unreadMessages).to.equal(0);
      });

      it('should guarantee that the unreadMessages in the mailboxesCache is never negative', function() {
        inboxMailboxesCache[0] = { id: 1, name: '1', unreadMessages: 0};

        mailboxesService.flagIsUnreadChanged({ mailboxIds: [1] }, false);

        expect(inboxMailboxesCache[0].unreadMessages).to.equal(0);
      });
    });

    describe('The assignMailbox function', function() {

      beforeEach(function() {
        jmapClient.getMailboxes = function() {
          return $q.when([{name: 'name'}]);
        };
      });

      it('should return a promise', function(done) {

        mailboxesService.assignMailbox().then(function() {

          done();
        });

        $rootScope.$digest();
      });

      it('should pass the mailbox.id to jmapClient.getMailboxes', function(done) {

        jmapClient.getMailboxes = function(data) {
          expect(data).to.deep.equal({ids: [2]});
          done();
        };

        mailboxesService.assignMailbox(2);
      });

      it('should not query the backend if useCache is true and the mailbox is already cached', function(done) {
        jmapClient.getMailboxes = sinon.spy();
        inboxMailboxesCache[0] = { id: 1, name: '1' };
        inboxMailboxesCache[1] = { id: 2, name: '2' };

        mailboxesService.assignMailbox(2, null, true).then(function(mailbox) {
          expect(jmapClient.getMailboxes).to.have.not.been.calledWith();
          expect(mailbox.name).to.equal('2');

          done();
        });
        $rootScope.$digest();
      });

      it('should assign dst.mailbox if dst is given', function(done) {
        var object = {};

        jmapClient.getMailboxes = function() {
          return $q.when([new jmap.Mailbox(jmapClient, 'id', 'name')]);
        };

        mailboxesService.assignMailbox('id', object).then(function() {
          expect(object.mailbox).to.shallowDeepEqual({
            id: 'id',
            name: 'name',
            level: 1,
            qualifiedName: 'name'
          });

          done();
        });

        $rootScope.$digest();
      });

      it('should assign dst.mailbox if dst is given and dst.mailbox does not exist yet', function(done) {
        var object = { mailbox: 'mailbox' };

        mailboxesService.assignMailbox(null, object).then(function() {
          expect(object.mailbox).to.equal('mailbox');

          done();
        });

        $rootScope.$digest();
      });

      it('should add level and qualifiedName properties to mailbox', function() {
        mailboxesService.assignMailbox().then(function() {
          expect(inboxMailboxesCache[0]).to.deep.equal({ name: 'name', level: 1, qualifiedName: 'name' });
        });

        $rootScope.$digest();
      });
    });

    describe('The moveUnreadMessages function', function() {

      it('should decrease unread messages of from mailboxes and increase it for to mailboxes', function() {
        var destObject = {};

        jmapClient.getMailboxes = function() {
          return $q.when([
            { id: 1, unreadMessages: 1},
            { id: 2, unreadMessages: 2}
          ]);
        };

        mailboxesService.assignMailboxesList(destObject);
        $rootScope.$digest();
        mailboxesService.moveUnreadMessages([1], [2], 1);

        expect(destObject.mailboxes).to.shallowDeepEqual([
          { id: 1, unreadMessages: 0},
          { id: 2, unreadMessages: 3}
        ]);
      });

    });

    describe('The canMoveMessage function', function() {

      var message, mailbox, draftMailbox, outboxMailbox;
      var inboxSpecialMailboxes;

      beforeEach(function() {
        message = {
          isDraft: false,
          mailboxIds: [0]
        };
        mailbox = {
          id: 1,
          role: {}
        };
      });

      beforeEach(inject(function(_inboxSpecialMailboxes_) {
        inboxSpecialMailboxes = _inboxSpecialMailboxes_;

        inboxSpecialMailboxes.get = function() {};

        draftMailbox = { id: 11, role: jmap.MailboxRole.DRAFTS };
        outboxMailbox = { id: 22, role: jmap.MailboxRole.OUTBOX };
        jmapClient.getMailboxes = function() {
          return $q.when([draftMailbox, outboxMailbox]);
        };
        mailboxesService.assignMailboxesList({});
        $rootScope.$digest();
      }));

      function checkResult(result) {
        expect(mailboxesService.canMoveMessage(message, mailbox)).to.equal(result);
      }

      it('should allow moving message to mailbox by default value', function() {
        checkResult(true);
      });

      it('should disallow moving draft message', function() {
        message.isDraft = true;
        checkResult(false);
      });

      it('should disallow moving message to same mailbox', function() {
        message.mailboxIds = [1, 2];
        checkResult(false);
      });

      it('should disallow moving message to Draft mailbox', function() {
        mailbox.role = jmap.MailboxRole.DRAFTS;
        checkResult(false);
      });

      it('should disallow moving message to Outbox mailbox', function() {
        mailbox.role = jmap.MailboxRole.OUTBOX;
        checkResult(false);
      });

      it('should disallow moving message out from Draft mailbox', function() {
        message.mailboxIds = [draftMailbox.id];
        checkResult(false);
      });

      it('should disallow moving message out from Outbox mailbox', function() {
        message.mailboxIds = [outboxMailbox.id];
        checkResult(false);
      });

      it('should allow moving message out from mailbox that is not in mailboxesCache', function() {
        message.mailboxIds = [99];
        checkResult(true);
      });

      it('should disallow moving message to special mailbox', function() {
        inboxSpecialMailboxes.get = function() {
          return { id: 'special mailbox id' };
        };
        checkResult(false);
      });

    });

    describe('The getMessageListFilter function', function() {

      var inboxSpecialMailboxes;

      beforeEach(inject(function(_inboxSpecialMailboxes_) {
        inboxSpecialMailboxes = _inboxSpecialMailboxes_;
      }));

      it('should filter message in the mailbox if input mailbox ID is not special one', function(done) {
        var mailboxId = '123';

        inboxSpecialMailboxes.get = function() {};

        mailboxesService.getMessageListFilter(mailboxId).then(function(filter) {
          expect(filter).to.deep.equal({ inMailboxes: [mailboxId] });
          done();
        });

        $rootScope.$digest();

      });

      it('should use filter of the mailbox if input mailbox ID is a special one', function(done) {
        var mailboxId = '123';
        var specialMailbox = {
          id: mailboxId,
          filter: { filter: 'condition' }
        };

        inboxSpecialMailboxes.get = function() {
          return specialMailbox;
        };

        mailboxesService.getMessageListFilter(mailboxId).then(function(filter) {
          expect(filter).to.deep.equal(specialMailbox.filter);
          done();
        });

        $rootScope.$digest();
      });

      it('should convert mailbox role to mailbox ID in filter of special mailbox in the first use', function(done) {
        var mailboxId = '123';
        var excludedMailboxRoles = [{ value: 'role' }, { value: 'not found role' }];
        var mailboxes = [{
          id: 'matched role',
          role: excludedMailboxRoles[0]
        }, {
          id: 'unmatched role',
          role: { value: 'unmatched role' }
        }];
        var specialMailbox = {
          id: mailboxId,
          filter: {
            unprocessed: true,
            notInMailboxes: excludedMailboxRoles
          }
        };

        inboxSpecialMailboxes.get = function() {
          return specialMailbox;
        };

        jmapClient.getMailboxes = sinon.stub().returns($q.when(mailboxes));

        mailboxesService.getMessageListFilter(mailboxId).then(function(filter) {
          expect(jmapClient.getMailboxes).to.have.been.calledWith();
          expect(filter).to.deep.equal({
            notInMailboxes: [mailboxes[0].id]
          });
          done();
        });

        $rootScope.$digest();
      });

      it('should use empty array in filter if JMAP client fails to get mailboxes', function(done) {
        var mailboxId = '123';
        var excludedMailboxRoles = [{ value: 'role' }];
        var specialMailbox = {
          id: mailboxId,
          filter: {
            unprocessed: true,
            notInMailboxes: excludedMailboxRoles
          }
        };

        inboxSpecialMailboxes.get = function() {
          return specialMailbox;
        };

        jmapClient.getMailboxes = sinon.stub().returns($q.reject());

        mailboxesService.getMessageListFilter(mailboxId).then(function(filter) {
          expect(jmapClient.getMailboxes).to.have.been.calledWith();
          expect(filter).to.deep.equal({
            notInMailboxes: []
          });
          done();
        });

        $rootScope.$digest();
      });

    });

    describe('The createMailbox function', function() {

      var mailbox = {
        id: 'id',
        name: 'name',
        parentId: 123,
        qualifiedName: 'name',
        level: 1
      };

      it('should call client.createMailbox', function(done) {
        jmapClient.createMailbox = function(name, parentId) {
          expect(name).to.equal('name');
          expect(parentId).to.equal(123);
          done();
        };

        mailboxesService.createMailbox(mailbox);
        $rootScope.$digest();
      });

      it('should not update the cache if the creation fails', function(done) {
        jmapClient.createMailbox = function() {
          return $q.reject();
        };

        mailboxesService.createMailbox('name', 123).then(null, function() {
          expect(inboxMailboxesCache.length).to.equal(0);

          done();
        });
        $rootScope.$digest();
      });

      it('should display an error notification with a "Reopen" link', function(done) {
        jmapClient.createMailbox = function() {
          return $q.reject();
        };
        mailboxesService.createMailbox(mailbox).then(null, function() {
          expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Creation of folder name failed');

          done();
        });
        $rootScope.$digest();
      });

      it('should update the cache with a qualified mailbox if the creation succeeds', function(done) {
        jmapClient.createMailbox = function(name, parentId) {
          return $q.when(new jmap.Mailbox(jmapClient, 'id', 'name', {
            parentId: parentId
          }));
        };

        mailboxesService.createMailbox(mailbox).then(function() {
          expect(inboxMailboxesCache).to.shallowDeepEqual([{
            id: 'id',
            name: 'name',
            parentId: 123,
            qualifiedName: 'name',
            level: 1
          }]);

          done();
        });
        $rootScope.$digest();
      });

    });

    describe('The destroyMailbox function', function() {

      it('should call client.setMailboxes, passing the mailbox id if it has no children', function(done) {
        jmapClient.setMailboxes = function(options) {
          expect(options).to.deep.equal({
            destroy: [123]
          });

          done();
        };

        mailboxesService.destroyMailbox(Mailbox({ id: 123, name: '123'}));
      });

      it('should destroy children mailboxes before the parent', function(done) {
        inboxMailboxesCache.push(Mailbox({ id: 1, parentId: 2, name: '1'}));
        jmapClient.setMailboxes = function(options) {
          expect(options).to.deep.equal({
            destroy: [1, 2]
          });

          done();
        };

        mailboxesService.destroyMailbox(Mailbox({ id: 2, name: '2'}));
      });

      it('should remove destroyed mailboxes from the cache, when call succeeds', function(done) {
        inboxMailboxesCache.push(Mailbox({ id: 1, parentId: 2, name: '1'}));
        inboxMailboxesCache.push(Mailbox({ id: 2, name: '2'}));
        jmapClient.setMailboxes = function() {
          return $q.when(new jmap.SetResponse(jmapClient, { destroyed: [1, 2] }));
        };

        mailboxesService.destroyMailbox(Mailbox({ id: 2, name: '2' })).then(function() {
          expect(inboxMailboxesCache).to.deep.equal([]);

          done();
        });
        $rootScope.$digest();
      });

      it('should remove destroyed mailboxes from the cache, when call does not succeed completely', function(done) {
        inboxMailboxesCache.push(Mailbox({ id: 1, parentId: 2, name: '1' }));
        inboxMailboxesCache.push(Mailbox({ id: 2, name: '2' }));
        jmapClient.setMailboxes = function() {
          return $q.when(new jmap.SetResponse(jmapClient, { destroyed: [1] }));
        };

        mailboxesService.destroyMailbox(Mailbox({ id: 2, name: '2' })).then(null, function() {
          expect(inboxMailboxesCache).to.deep.equal([{ id: 2, name: '2' }]);

          done();
        });
        $rootScope.$digest();
      });

    });

    describe('The updateMailbox function', function() {
      var originalMailbox;

      beforeEach(function() {
        originalMailbox = Mailbox({ id: 'id', name: 'name' });
      });

      it('should call client.updateMailbox, passing the new options', function(done) {
        jmapClient.updateMailbox = function(id, options) {
          expect(id).to.equal('id');
          expect(options).to.deep.equal({
            name: 'name',
            parentId: 123
          });

          done();
        };

        mailboxesService.updateMailbox(originalMailbox, { id: 'id', name: 'name', parentId: 123 });
      });

      it('should not update the cache if the update fails', function(done) {
        jmapClient.updateMailbox = function() {
          return $q.reject();
        };

        mailboxesService.updateMailbox(originalMailbox, { id: 'id', name: 'name' }).then(null, function() {
          expect(inboxMailboxesCache.length).to.equal(0);

          done();
        });
        $rootScope.$digest();
      });

      it('should update the cache with a qualified mailbox if the update succeeds', function(done) {
        jmapClient.updateMailbox = function() {
          return $q.when(new jmap.Mailbox(jmapClient, 'id', 'name'));
        };

        mailboxesService.updateMailbox(originalMailbox, { id: 'id', name: 'name' }).then(function() {
          expect(inboxMailboxesCache).to.shallowDeepEqual([{
            id: 'id',
            name: 'name',
            qualifiedName: 'name',
            level: 1
          }]);

          done();
        });
        $rootScope.$digest();
      });

      it('should update other mailboxes in cache when call succeeds, to reflect hierarchy changes', function(done) {
        inboxMailboxesCache.push(Mailbox({ id: '1', name: '1', qualifiedName: '1' }));
        inboxMailboxesCache.push(Mailbox({ id: '2', name: '2', parentId: '1', level: 2, qualifiedName: '1 / 2' }));
        inboxMailboxesCache.push(Mailbox({ id: '3', name: '3', parentId: '1', level: 2, qualifiedName: '1 / 3' }));
        inboxMailboxesCache.push(Mailbox({ id: '4', name: '4', parentId: '2', level: 3, qualifiedName: '1 / 2 / 4' }));
        jmapClient.updateMailbox = function() {
          return $q.when(new jmap.Mailbox(jmapClient, '1', '1_Renamed'));
        };

        mailboxesService.updateMailbox(originalMailbox, { id: '1', name: '1_Renamed' }).then(function() {
          expect(inboxMailboxesCache).to.shallowDeepEqual([{
            id: '1',
            name: '1_Renamed',
            qualifiedName: '1_Renamed',
            level: 1
          }, {
            id: '2',
            name: '2',
            qualifiedName: '1_Renamed / 2',
            level: 2
          }, {
            id: '3',
            name: '3',
            qualifiedName: '1_Renamed / 3',
            level: 2
          }, {
            id: '4',
            name: '4',
            qualifiedName: '1_Renamed / 2 / 4',
            level: 3
          }]);

          done();
        });
        $rootScope.$digest();
      });

    });

  });

  describe('The backgroundAction factory', function() {

    var $rootScope, backgroundAction, asyncAction, backgroundProcessorService;

    beforeEach(module(function($provide) {
      $provide.value('asyncAction', asyncAction = sinon.spy(function(message, action) {
        return action();
      }));
    }));

    beforeEach(inject(function(_$rootScope_, _backgroundAction_, _backgroundProcessorService_) {
      $rootScope = _$rootScope_;
      backgroundAction = _backgroundAction_;
      backgroundProcessorService = _backgroundProcessorService_;
    }));

    it('should wrap the action into a background asyncAction', function() {
      var message = 'action message',
          options = {expected: 'opts'},
          action = sinon.stub().returns($q.when());

      backgroundAction(message, action, options);
      var afterSubmitTaskCount = backgroundProcessorService.tasks.length;

      $rootScope.$digest();
      var afterDigestTaskCount = backgroundProcessorService.tasks.length;

      expect(afterSubmitTaskCount).to.equal(1);
      expect(afterDigestTaskCount).to.equal(0);
      expect(action).to.have.been.calledOnce;
      expect(asyncAction).to.have.been.calledWith(message, sinon.match.func, options);
    });

    it('should resolve with the action result when succeed', function(done) {
      var actionResult = {result: 'value'},
          action = sinon.stub().returns($q.when(actionResult));

      backgroundAction('action message', action).then(function(resolvedValue) {
        expect(resolvedValue).to.deep.equal(actionResult);
        done();
      }, done);
      $rootScope.$digest();
    });

    it('should resolve with the action error when failed', function(done) {
      var actionError = new Error('expect error'),
          action = sinon.stub().returns($q.reject(actionError));

      backgroundAction('action message', action).then(
        done.bind(null, 'should be rejected'),
        function(err) {
          expect(err).to.deep.equal(actionError);
          done();
        });
      $rootScope.$digest();
    });
  });

  describe('The asyncJmapAction factory', function() {

    var asyncJmapAction, backgroundAction, withJmapClient;

    beforeEach(module(function($provide) {
      $provide.value('backgroundAction', sinon.spy(function(message, action) { return action(); }));
      $provide.value('withJmapClient', sinon.spy(function(callback) { return callback; }));
    }));

    beforeEach(inject(function(_asyncJmapAction_, _backgroundAction_, _withJmapClient_) {
      backgroundAction = _backgroundAction_;
      withJmapClient = _withJmapClient_;
      asyncJmapAction = _asyncJmapAction_;
    }));

    it('should delegate to backgroundAction, forwarding the message and the wrapped action', function() {
      asyncJmapAction('Message', 1, {expected: 'options'});

      expect(withJmapClient).to.have.been.calledWith(1);
      expect(backgroundAction).to.have.been.calledWith('Message', sinon.match.func, {expected: 'options'});
    });

  });

  describe('The searchService factory', function() {

    var $rootScope, searchService;

    beforeEach(inject(function(_$rootScope_, _searchService_) {
      $rootScope = _$rootScope_;
      searchService = _searchService_;
    }));

    describe('The searchRecipients method', function() {

      it('should delegate to attendeeService', function() {
        attendeeService.getAttendeeCandidates = sinon.spy(function() { return $q.when(); });

        searchService.searchRecipients('open-paas.org');

        expect(attendeeService.getAttendeeCandidates).to.have.been.calledWith('open-paas.org');
      });

      it('should return an empty array if the search fails', function(done) {
        attendeeService.getAttendeeCandidates = sinon.spy(function() { return $q.reject(); });

        searchService.searchRecipients('open-paas.org').then(function(results) {
          expect(results).to.deep.equal([]);

          done();
        });
        $rootScope.$digest();
      });

      it('should exclude search results with no email', function(done) {
        attendeeService.getAttendeeCandidates = function(query) {
          expect(query).to.equal('open-paas.org');

          return $q.when([{
            name: 'user1',
            email: 'user1@open-paas.org'
          }, {
            name: 'user2'
          }]);
        };

        searchService.searchRecipients('open-paas.org')
          .then(function(results) {
            expect(results).to.deep.equal([{
              name: 'user1',
              email: 'user1@open-paas.org'
            }]);
          })
          .then(done, done);

        $rootScope.$digest();
      });

      it('should assign name of the recipient from its displayName when he has none', function(done) {
        attendeeService.getAttendeeCandidates = function(query) {
          expect(query).to.equal('open-paas.org');

          return $q.when([{
            name: '',
            email: 'empty@open-paas.org'
          }, {
            email: 'none@open-paas.org'
          }, {
            name: 'expected name',
            displayName: 'not expected name',
            email: 'with-name@open-paas.org'
          }, {
            displayName: 'expected name',
            email: 'with-display-name-only@open-paas.org'
          }]);
        };

        searchService.searchRecipients('open-paas.org')
          .then(function(results) {
            expect(results).to.deep.equal([{
              name: 'empty@open-paas.org',
              email: 'empty@open-paas.org'
            }, {
              name: 'none@open-paas.org',
              email: 'none@open-paas.org'
            }, {
              name: 'expected name',
              displayName: 'not expected name',
              email: 'with-name@open-paas.org'
            }, {
              name: 'expected name',
              displayName: 'expected name',
              email: 'with-display-name-only@open-paas.org'
            }]);
          })
          .then(done, done);

        $rootScope.$digest();
      });

    });

    describe('The searchByEmail method', function() {

      it('should delegate to attendeeService, requesting a single result, and return the match if there is one', function(done) {
        attendeeService.getAttendeeCandidates = sinon.spy(function() { return $q.when([{ a: 'b' }]); });

        searchService.searchByEmail('me@open-paas.org').then(function(result) {
          expect(attendeeService.getAttendeeCandidates).to.have.been.calledWith('me@open-paas.org', 1);
          expect(result).to.deep.equal({ a: 'b' });

          done();
        });
        $rootScope.$digest();
      });

      it('should cache the result', function(done) {
        attendeeService.getAttendeeCandidates = sinon.spy(function() { return $q.when([{ a: 'b' }]); });

        searchService.searchByEmail('me@open-paas.org').then(function(result) {
          expect(attendeeService.getAttendeeCandidates).to.have.been.calledWith('me@open-paas.org', 1);
          expect(result).to.deep.equal({ a: 'b' });
        });
        $rootScope.$digest();

        attendeeService.getAttendeeCandidates.reset();
        searchService.searchByEmail('me@open-paas.org').then(function(result) {
          expect(attendeeService.getAttendeeCandidates).to.have.not.been.calledWith();
          expect(result).to.deep.equal({ a: 'b' });

          done();
        });
        $rootScope.$digest();
      });

      it('should return null if there is no match', function(done) {
        attendeeService.getAttendeeCandidates = sinon.spy(function() { return $q.when([]); });

        searchService.searchByEmail('me@open-paas.org').then(function(result) {
          expect(result).to.equal(null);

          done();
        });
        $rootScope.$digest();
      });

      it('should return null if search fails', function(done) {
        attendeeService.getAttendeeCandidates = sinon.spy(function() { return $q.reject(); });

        searchService.searchByEmail('me@open-paas.org').then(function(result) {
          expect(result).to.equal(null);

          done();
        });
        $rootScope.$digest();
      });

    });

  });

  describe('The inboxJmapItemService service', function() {

    var $rootScope, jmap, inboxJmapItemService, newComposerService, emailSendingService,
        quoteEmail, jmapClientMock, notificationFactory, backgroundAction, counter, infiniteListService, inboxSelectionService, INFINITE_LIST_EVENTS;

    beforeEach(module(function($provide) {
      counter = 0;
      jmapClientMock = {
        setMessages: sinon.spy(function() {
          return $q.when(new jmap.SetResponse(jmapClientMock));
        })
      };
      quoteEmail = function() { return {transformed: 'value'}; };

      $provide.value('withJmapClient', function(callback) { return callback(jmapClientMock); });
      $provide.value('newComposerService', newComposerService = { open: sinon.spy() });
      $provide.decorator('backgroundAction', function($delegate) {
        return sinon.spy(function(message, action, options) {
          return $delegate(message, action, options);
        });
      });
      $provide.value('emailSendingService', emailSendingService = {
        createReplyEmailObject: sinon.spy(function(email) { return $q.when(quoteEmail(email)); }),
        createReplyAllEmailObject: sinon.spy(function(email) { return $q.when(quoteEmail(email)); }),
        createForwardEmailObject: sinon.spy(function(email) { return $q.when(quoteEmail(email)); })
      });
    }));

    beforeEach(inject(function(_$rootScope_, _jmap_, _inboxJmapItemService_, _backgroundAction_, _notificationFactory_,
                               _infiniteListService_, _inboxSelectionService_, _INFINITE_LIST_EVENTS_) {
      $rootScope = _$rootScope_;
      jmap = _jmap_;
      inboxJmapItemService = _inboxJmapItemService_;
      backgroundAction = _backgroundAction_;
      notificationFactory = _notificationFactory_;
      infiniteListService = _infiniteListService_;
      inboxSelectionService = _inboxSelectionService_;
      INFINITE_LIST_EVENTS = _INFINITE_LIST_EVENTS_;

      inboxSelectionService.unselectAllItems = sinon.spy(inboxSelectionService.unselectAllItems);
      infiniteListService.actionRemovingElements = sinon.spy(infiniteListService.actionRemovingElements);
      inboxJmapItemService.setFlag = sinon.spy(inboxJmapItemService.setFlag);
      notificationFactory.weakError = sinon.spy(notificationFactory.weakError);
    }));

    function newEmail(isUnread, isFlagged) {
      return new jmap.Message({}, 'id' + ++counter, 'threadId', ['inbox'], {
        subject: 'subject',
        isUnread: isUnread,
        isFlagged: isFlagged
      });
    }

    function mockSetMessages(rejectedIds) {
      jmapClientMock.setMessages = sinon.spy(function() {
        return $q.when(new jmap.SetResponse(jmapClientMock, { notUpdated: rejectedIds || {} }));
      });
    }

    describe('The moveToTrash fn', function() {

      it('should delegate to infiniteListService.actionRemovingElements', function(done) {
        var email = {
          moveToMailboxWithRole: function() {
            expect(infiniteListService.actionRemovingElements).to.have.been.calledWith();

            done();
          }
        };
        inboxJmapItemService.moveToTrash(email);
      });

      it('should call email.moveToMailboxWithRole with the "trash" role', function(done) {
        var email = {
          moveToMailboxWithRole: function(role) {
            expect(role).to.equal(jmap.MailboxRole.TRASH);

            done();
          }
        };
        inboxJmapItemService.moveToTrash(email);
      });

      it('should pass options to backgroundAction', function() {
        var email = {
          moveToMailboxWithRole: sinon.spy(function() { return $q.when(); })
        };

        inboxJmapItemService.moveToTrash(email, {option: 'option'});

        expect(email.moveToMailboxWithRole).to.have.been.calledWith();
        expect(backgroundAction).to.have.been.calledWith(sinon.match.string, sinon.match.func, {option: 'option'});
      });

    });

    describe('The moveToMailbox function', function() {

      var mailboxesService, mailbox;

      beforeEach(inject(function(_mailboxesService_) {
        mailboxesService = _mailboxesService_;

        mailboxesService.moveUnreadMessages = sinon.spy(mailboxesService.moveUnreadMessages);
        mailbox = { id: 'mailboxId', name: 'inbox', displayName: 'inbox' };
      }));

      it('should notify with a single-item error message when setMessages fails for a single item', function(done) {
        mockSetMessages({ id1: 'error' });

        inboxJmapItemService.moveToMailbox(newEmail(), mailbox).catch(function() {
          expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Cannot move "subject" to "inbox"');

          done();
        });
        $rootScope.$digest();
      });

      it('should notify with a multiple-items error message when setMessages fails for multiple items', function(done) {
        mockSetMessages({ id1: 'error' });

        inboxJmapItemService.moveToMailbox([newEmail(), newEmail()], mailbox).catch(function() {
          expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Some items could not be moved to "inbox"');

          done();
        });
        $rootScope.$digest();
      });

      it('should call setMessages with the correct options for a single item, and resolve when setMessages succeeds', function(done) {
        mockSetMessages();

        inboxJmapItemService.moveToMailbox(newEmail(), mailbox).then(function() {
          expect(jmapClientMock.setMessages).to.have.been.calledWith({
            update: {
              id1: { mailboxIds: ['mailboxId'] }
            }
          });

          done();
        });
        $rootScope.$digest();
      });

      it('should call setMessages with the correct options for multiple item, and resolve when setMessages succeeds', function(done) {
        mockSetMessages();

        inboxJmapItemService.moveToMailbox([newEmail(), newEmail(), newEmail()], mailbox).then(function() {
          expect(jmapClientMock.setMessages).to.have.been.calledWith({
            update: {
              id1: { mailboxIds: ['mailboxId'] },
              id2: { mailboxIds: ['mailboxId'] },
              id3: { mailboxIds: ['mailboxId'] }
            }
          });

          done();
        });
        $rootScope.$digest();
      });

      it('should update unread messages without waiting for a reply on all items', function(done) {
        var email = newEmail(true),
            email2 = newEmail(true);

        mockSetMessages();

        inboxJmapItemService.moveToMailbox([email, email2], mailbox).then(done);
        expect(mailboxesService.moveUnreadMessages).to.have.been.calledTwice;
        expect(mailboxesService.moveUnreadMessages).to.have.been.calledWith(['inbox'], ['mailboxId'], 1);
        expect(mailboxesService.moveUnreadMessages).to.have.been.calledWith(['inbox'], ['mailboxId'], 1);

        $rootScope.$digest();
      });

      it('should revert the update of unread messages on failure, and rejects the promise', function(done) {
        var email = newEmail(true),
            email2 = newEmail(true);

        mockSetMessages({ id1: 'error' });

        inboxJmapItemService.moveToMailbox([email, email2], mailbox).catch(function() {
          expect(mailboxesService.moveUnreadMessages).to.have.been.calledOnce;
          expect(mailboxesService.moveUnreadMessages).to.have.been.calledWith(['mailboxId'], ['inbox'], 1);

          done();
        });
        mailboxesService.moveUnreadMessages.reset();

        $rootScope.$digest();
      });

    });

    describe('The moveMultipleItems function', function() {

      it('should delegate to infiniteListService.actionRemovingElements, moving all items', function(done) {
        var item1 = { id: 1, mailboxIds: [] },
            item2 = { id: 2, mailboxIds: [] },
            mailbox = { id: 'mailbox' };

        inboxJmapItemService.moveMultipleItems([item1, item2], mailbox).then(function() {
          expect(infiniteListService.actionRemovingElements).to.have.been.calledOnce;
          expect(jmapClientMock.setMessages).to.have.been.calledWith({
            update: {
              1: { mailboxIds: ['mailbox'] },
              2: { mailboxIds: ['mailbox'] }
            }
          });

          done();
        });
        $rootScope.$digest();
      });

      it('should only add failing items back to the list', function(done) {
        var item1 = { id: 1, mailboxIds: [] },
            item2 = { id: 2, mailboxIds: [] },
            mailbox = { id: 'mailbox' };

        mockSetMessages({ 2: 'error' });

        $rootScope.$on(INFINITE_LIST_EVENTS.ADD_ELEMENTS, function(event, elements) {
          expect(elements).to.deep.equal([item2]);

          done();
        });

        inboxJmapItemService.moveMultipleItems([item1, item2], mailbox);
        $rootScope.$digest();
      });

      it('should unselect all items', function() {
        inboxJmapItemService.moveMultipleItems([{ id: 1, mailboxIds: [] }], { id: 'mailbox' });

        expect(inboxSelectionService.unselectAllItems).to.have.been.calledWith();
      });

    });

    describe('The reply function', function() {

      it('should leverage open() and createReplyEmailObject()', function() {
        var inputEmail = { id: 'id', input: 'value' };
        inboxJmapItemService.reply(inputEmail);
        $rootScope.$digest();

        expect(emailSendingService.createReplyEmailObject).to.have.been.calledWith('id');
        expect(newComposerService.open).to.have.been.calledWith(quoteEmail(inputEmail));
      });

    });

    describe('The replyAll function', function() {

      it('should leverage open() and createReplyAllEmailObject()', function() {
        var inputEmail = { id: 'id', input: 'value' };
        inboxJmapItemService.replyAll(inputEmail);
        $rootScope.$digest();

        expect(emailSendingService.createReplyAllEmailObject).to.have.been.calledWith('id');
        expect(newComposerService.open).to.have.been.calledWith(quoteEmail(inputEmail));
      });

    });

    describe('The forward function', function() {

      it('should leverage open() and createForwardEmailObject()', function() {
        var inputEmail = { id: 'id', input: 'value' };
        inboxJmapItemService.forward(inputEmail);
        $rootScope.$digest();

        expect(emailSendingService.createForwardEmailObject).to.have.been.calledWith('id');
        expect(newComposerService.open).to.have.been.calledWith(quoteEmail(inputEmail));
      });

    });

    describe('The markAsUnread function', function() {

      it('should call setFlag', function() {
        var email = newEmail();

        inboxJmapItemService.markAsUnread(email);

        expect(inboxJmapItemService.setFlag).to.have.been.calledWith(email, 'isUnread', true);
      });

    });

    describe('The markAsRead function', function() {

      it('should call setFlag', function() {
        var email = newEmail();

        inboxJmapItemService.markAsRead(email);

        expect(inboxJmapItemService.setFlag).to.have.been.calledWith(email, 'isUnread', false);
      });
    });

    describe('The markAsFlagged function', function() {

      it('should call setFlag', function() {
        var email = newEmail();

        inboxJmapItemService.markAsFlagged(email);

        expect(inboxJmapItemService.setFlag).to.have.been.calledWith(email, 'isFlagged', true);
      });

    });

    describe('The unmarkAsFlagged function', function() {

      it('should call setFlag', function() {
        var email = newEmail();

        inboxJmapItemService.unmarkAsFlagged(email);

        expect(inboxJmapItemService.setFlag).to.have.been.calledWith(email, 'isFlagged', false);
      });

    });

    describe('The setFlag function', function() {

      it('should notify with a single-item error message when setMessages fails for a single item', function(done) {
        mockSetMessages({ id1: 'error' });

        inboxJmapItemService.setFlag(newEmail(), 'isUnread', true).catch(function() {
          expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Could not update "subject"');

          done();
        });
        $rootScope.$digest();
      });

      it('should notify with a multiple-items error message when setMessages fails for multiple items', function(done) {
        mockSetMessages({ id1: 'error' });

        inboxJmapItemService.setFlag([newEmail(), newEmail()], 'isUnread', true).catch(function() {
          expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Some items could not be updated');

          done();
        });
        $rootScope.$digest();
      });

      it('should call setMessages with the correct options for a single item, and resolve when setMessages succeeds', function(done) {
        mockSetMessages();

        inboxJmapItemService.setFlag(newEmail(), 'isUnread', true).then(function() {
          expect(jmapClientMock.setMessages).to.have.been.calledWith({
            update: {
              id1: { isUnread: true }
            }
          });

          done();
        });
        $rootScope.$digest();
      });

      it('should call setMessages with the correct options for multiple item, and resolve when setMessages succeeds', function(done) {
        mockSetMessages();

        inboxJmapItemService.setFlag([newEmail(), newEmail(), newEmail()], 'isUnread', true).then(function() {
          expect(jmapClientMock.setMessages).to.have.been.calledWith({
            update: {
              id1: { isUnread: true },
              id2: { isUnread: true },
              id3: { isUnread: true }
            }
          });

          done();
        });
        $rootScope.$digest();
      });

      it('should change the flag without waiting for a reply on all items', function(done) {
        var email = newEmail(),
            email2 = newEmail();

        mockSetMessages();

        inboxJmapItemService.setFlag([email, email2], 'isUnread', true).then(done);
        expect(email.isUnread).to.equal(true);
        expect(email2.isUnread).to.equal(true);

        $rootScope.$digest();
      });

      it('should revert the flag on the failing email objects on failure, and rejects the promise', function(done) {
        var email = newEmail(),
            email2 = newEmail();

        mockSetMessages({ id1: 'error' });

        inboxJmapItemService.setFlag([email, email2], 'isUnread', true).catch(function() {
          expect(email.isUnread).to.equal(false);
          expect(email2.isUnread).to.equal(true);

          done();
        });
        $rootScope.$digest();
      });

    });

  });

  describe('The attachmentUploadService service', function() {

    var $rootScope, jmapClientProviderMock = {}, jmapClientMock, backgroundProcessorService, attachmentUploadService, file = { name: 'n', size: 1, type: 'type'};

    beforeEach(module(function($provide) {
      $provide.value('withJmapClient', function(callback) {
        return callback(null);
      });
      $provide.value('jmapClientProvider', jmapClientProviderMock);
      config['linagora.esn.unifiedinbox.uploadUrl'] = 'http://jmap';

      $.mockjaxSettings.logging = false;
    }));

    beforeEach(inject(function(_$rootScope_, _attachmentUploadService_, _backgroundProcessorService_) {
      $rootScope = _$rootScope_;
      attachmentUploadService = _attachmentUploadService_;
      backgroundProcessorService = _backgroundProcessorService_;

      sinon.spy(backgroundProcessorService, 'add');
    }));

    beforeEach(function() {
      jmapClientMock = {
        authToken: 'Bearer authToken'
      };
      jmapClientProviderMock.get = sinon.stub().returns($q.when(jmapClientMock));
    });

    afterEach(function() {
      $.mockjax.clear();
    });

    it('should call jmapClientProvider to get the authToken', function(done) {
      var mockjax = function(data) {
        expect(data.headers.Authorization).to.equal(jmapClientMock.authToken);

        return {
          response: function() {
            this.responseText = {};
          }
        };
      };

      $.mockjax(mockjax);

      attachmentUploadService
        .uploadFile(null, file, file.type, file.size, null, null)
        .then(function() {
          expect(jmapClientProviderMock.get).to.have.been.calledWith();

          done();
        });

      $rootScope.$digest();
    });

    it('should POST the file, passing the content type and resolve on success', function(done) {
      $.mockjax(function(options) {
        return {
          url: 'http://jmap',
          data: file,
          type: 'POST',
          response: function() {
            expect(options.headers['Content-Type']).to.equal(file.type);

            this.responseText = { a: 'b' };
          }
        };
      });

      attachmentUploadService
        .uploadFile(null, file, file.type, file.size, null, null)
        .then(function(data) {
          expect(data).to.deep.equal({ a: 'b' });

          done();
        });

      $rootScope.$digest();
    });

    it('should reject on error', function(done) {
      $.mockjax({
        url: 'http://jmap',
        response: function() {
          this.status = 500;
        }
      });

      attachmentUploadService
        .uploadFile(null, file, file.type, file.size, null, null)
        .then(null, function(err) {
          expect(err.xhr.status).to.equal(500);

          done();
        });

      $rootScope.$digest();
    });

    it('should reject on timeout', function(done) {
      $.mockjax({
        url: 'http://jmap',
        isTimeout: true
      });

      attachmentUploadService
        .uploadFile(null, file, file.type, file.size, null, null)
        .then(null, function(err) {
          expect(err.error).to.equal('timeout');

          done();
        });

      $rootScope.$digest();
    });

    it('should abort the request when the canceler resolves', function(done) {
      $.mockjax({
        url: 'http://jmap',
        responseTime: 10000
      });

      attachmentUploadService
        .uploadFile(null, file, file.type, file.size, null, $q.when())
        .then(done, function(err) {
          expect(err.error).to.equal('abort');

          done();
        });

      $rootScope.$digest();
    });

    it('should upload the file in background', function() {
      $.mockjax({
        url: 'http://jmap',
        type: 'POST',
        responseText: {a: 'b'}
      });

      attachmentUploadService.uploadFile(null, file, file.type, file.size, null, null);
      $rootScope.$digest();

      expect(backgroundProcessorService.add).to.have.been.calledWith();
    });

  });

  describe('The waitUntilMessageIsComplete factory', function() {

    var $rootScope, waitUntilMessageIsComplete;

    beforeEach(inject(function(_$rootScope_, _waitUntilMessageIsComplete_) {
      $rootScope = _$rootScope_;
      waitUntilMessageIsComplete = _waitUntilMessageIsComplete_;
    }));

    it('should resolve with the email when email has no attachments', function(done) {
      waitUntilMessageIsComplete({ subject: 'subject' }).then(function(value) {
        expect(value).to.deep.equal({ subject: 'subject' });

        done();
      });
      $rootScope.$digest();
    });

    it('should resolve when email attachments are all uploaded', function(done) {
      var message = {
        subject: 'subject',
        attachments: [{
          blobId: '1'
        }, {
          blobId: '2'
        }]
      };

      waitUntilMessageIsComplete(message).then(function(value) {
        expect(value).to.deep.equal(message);

        done();
      });
      $rootScope.$digest();
    });

    it('should resolve as soon as all attachments are done uploading', function(done) {
      var defer = $q.defer(),
          message = {
            subject: 'subject',
            attachments: [{
              blobId: '1',
              upload: {
                promise: $q.when()
              }
            }, {
              blobId: '',
              upload: {
                promise: defer.promise
              }
            }]
          };

      waitUntilMessageIsComplete(message).then(function(value) {
        expect(value).to.deep.equal(message);

        done();
      });
      defer.resolve();
      $rootScope.$digest();
    });

  });

  describe('The inboxSwipeHelper service', function() {

    var $rootScope, $timeout, inboxSwipeHelper;

    beforeEach(inject(function(_$rootScope_, _$timeout_, _inboxSwipeHelper_) {
      $rootScope = _$rootScope_;
      $timeout = _$timeout_;
      inboxSwipeHelper = _inboxSwipeHelper_;
    }));

    describe('The createSwipeRightHandler fn', function() {

      var swipeRightHandler;
      var scopeMock, handlersMock;

      beforeEach(function() {
        scopeMock = $rootScope.$new();
        scopeMock.swipeClose = sinon.spy();
        handlersMock = {
          markAsRead: sinon.spy()
        };

        swipeRightHandler = inboxSwipeHelper.createSwipeRightHandler(scopeMock, handlersMock);
      });

      it('should return a function', function() {
        expect(swipeRightHandler).to.be.a.function;
      });

      it('should return a function to close swipe after a timeout', function() {
        swipeRightHandler();
        $timeout.flush();

        expect(scopeMock.swipeClose).to.have.been.calledOnce;
      });

      it('should return a function to call markAsRead handle by default feature flip', function() {
        swipeRightHandler();
        $rootScope.$digest();

        expect(handlersMock.markAsRead).to.have.been.calledOnce;
      });

    });

  });

  describe('The inboxSpecialMailboxes service', function() {

    var inboxSpecialMailboxes;

    beforeEach(inject(function(_inboxSpecialMailboxes_) {
      inboxSpecialMailboxes = _inboxSpecialMailboxes_;
    }));

    describe('The list fn', function() {

      it('should return an array of special mailboxes with fake data', function() {
        var specialMailboxes = inboxSpecialMailboxes.list();

        expect(specialMailboxes).to.be.an.instanceof(Array);
        expect(specialMailboxes.length).to.equal(1);
        expect(specialMailboxes[0]).to.shallowDeepEqual({
          id: 'all',
          name: 'All Mail',
          role: { value: 'all' },
          qualifiedName: 'All Mail',
          unreadMessages: 0
        });
      });

    });

    describe('The get fn', function() {

      it('should return a mailbox if found', function() {
        var mailbox = inboxSpecialMailboxes.list()[0];
        var foundMailbox = inboxSpecialMailboxes.get(mailbox.id);

        expect(foundMailbox).to.deep.equal(mailbox);
      });

      it('should return undefined if not found', function() {
        expect(inboxSpecialMailboxes.get('not_found')).to.be.undefined;
      });

    });

  });

  describe('The inboxFilteringService service', function() {

    var _, service, filters, PROVIDER_TYPES;

    beforeEach(inject(function(inboxFilteringService, inboxFilters, ___, _PROVIDER_TYPES_) {
      service = inboxFilteringService;
      filters = inboxFilters;
      _ = ___;
      PROVIDER_TYPES = _PROVIDER_TYPES_;
    }));

    afterEach(function() {
      service.uncheckFilters();
    });

    function checkFilter(id) {
      _.find(filters, { id: id }).checked = true;
    }

    describe('The getFiltersForJmapMailbox function', function() {

      it('should return only JMAP filters', function() {
        expect(_.every(service.getFiltersForJmapMailbox(), { type: PROVIDER_TYPES.JMAP })).to.equal(true);
      });

      it('should not reset filters if called multiple times for the same mailbox', function() {
        var filters = service.getFiltersForJmapMailbox('mailbox1');

        filters[0].checked = true;
        filters = service.getFiltersForJmapMailbox('mailbox1');

        expect(filters[0].checked).to.equal(true);
      });

      it('should reset filters if called for another mailbox', function() {
        var filters = service.getFiltersForJmapMailbox('mailbox1');

        filters[0].checked = true;
        filters = service.getFiltersForJmapMailbox('other_mailbox');

        expect(_.every(filters, { checked: false })).to.equal(true);
      });

      it('should reset filters if filters are requested for a unified inbox afterwards', function() {
        var filters = service.getFiltersForJmapMailbox('mailbox1');

        filters[0].checked = true;
        filters = service.getFiltersForUnifiedInbox();

        expect(_.every(filters, { checked: false })).to.equal(true);
      });

    });

    describe('The getFiltersForUnifiedInbox function', function() {

      it('should return all filters of type SOCIAL and JMAP', function() {
        expect(service.getFiltersForUnifiedInbox()).to.have.length(4);
      });

      it('should not reset filters if called multiple times', function() {
        var filters = service.getFiltersForUnifiedInbox();

        filters[0].checked = true;
        filters = service.getFiltersForUnifiedInbox();

        expect(filters[0].checked).to.equal(true);
      });

      it('should reset filters if filters are requested for a JMAP mailbox afterwards', function() {
        var filters = service.getFiltersForUnifiedInbox();

        filters[0].checked = true;
        filters = service.getFiltersForJmapMailbox('mailbox1');

        expect(_.every(filters, { checked: false })).to.equal(true);
      });

    });

    describe('The getJmapFilter function', function() {

      it('should build a JMAP filter object, with a single selected filter', function() {
        checkFilter('isUnread');

        expect(service.getJmapFilter()).to.deep.equal({ isUnread: true });
      });

      it('should build a JMAP filter object, with multiple selected filters', function() {
        checkFilter('isUnread');
        checkFilter('hasAttachment');

        expect(service.getJmapFilter()).to.deep.equal({ isUnread: true, hasAttachment: true });
      });

      it('should build a empty JMAP filter object, when no filters are selected', function() {
        expect(service.getJmapFilter()).to.deep.equal({});
      });

    });

    describe('The isAnyFilterOfTypeSelected function', function() {

      it('should return false when no filters are checked', function() {
        expect(service.isAnyFilterOfTypeSelected(PROVIDER_TYPES.JMAP)).to.equal(false);
      });

      it('should return false when no filters of the given type are checked', function() {
        checkFilter('isSocial');

        expect(service.isAnyFilterOfTypeSelected(PROVIDER_TYPES.JMAP)).to.equal(false);
      });

      it('should return true when 1 filter of the given type is checked', function() {
        checkFilter('isUnread');

        expect(service.isAnyFilterOfTypeSelected(PROVIDER_TYPES.JMAP)).to.equal(true);
      });

      it('should return true when multiple filters of the given type are checked', function() {
        checkFilter('isUnread');
        checkFilter('isFlagged');

        expect(service.isAnyFilterOfTypeSelected(PROVIDER_TYPES.JMAP)).to.equal(true);
      });

    });

    describe('The getAcceptedTypesFilter function', function() {

      it('should return a list of provider types JMAP and SOCIAL when nothing is selected', function() {
        expect(service.getAcceptedTypesFilter()).to.deep.equal([PROVIDER_TYPES.JMAP, PROVIDER_TYPES.SOCIAL]);
      });

      it('should return an empty list when the selection is eclectic', function() {
        checkFilter('isSocial');
        checkFilter('isUnread');

        expect(service.getAcceptedTypesFilter()).to.deep.equal([]);
      });

      it('should return only JMAP provider if the selction is JMAP-only', function() {
        checkFilter('isUnread');

        expect(service.getAcceptedTypesFilter()).to.deep.equal([PROVIDER_TYPES.JMAP]);
      });

      it('should return only SOCIAL provider if the selction is SOCIAL-only', function() {
        checkFilter('isSocial');

        expect(service.getAcceptedTypesFilter()).to.deep.equal([PROVIDER_TYPES.SOCIAL]);
      });

    });

    describe('The uncheckFilters function', function() {

      it('should uncheck all filters', function() {
        filters.forEach(function(filter) {
          filter.checked = true;
        });

        service.uncheckFilters();

        expect(_.every(filters, { checked: false })).to.equal(true);
      });

    });

    describe('The isAnyFilterSelected function', function() {

      it('should return false if no filter is checked', function() {
        expect(service.isAnyFilterSelected()).to.equal(false);
      });

      it('should return true if 1 filter is checked', function() {
        checkFilter('isSocial');

        expect(service.isAnyFilterSelected()).to.equal(true);
      });

      it('should return true if more than 1 filter is checked', function() {
        checkFilter('isSocial');
        checkFilter('isUnread');

        expect(service.isAnyFilterSelected()).to.equal(true);
      });

    });

    describe('The getSelectedTwitterProviderIds function', function() {

      it('should return all Twitter provider ids when nothing is selected', function() {
        var twitterFilters = _(filters).filter({ type: PROVIDER_TYPES.TWITTER }).map(function(filter) {
          return filter.id + 'Account1';
        }).value();

        expect(service.getSelectedTwitterProviderIds('Account1')).to.deep.equal(twitterFilters);
      });

      it('should return only selected Twitter provider ids', function() {
        checkFilter('inboxTwitterMentions');

        expect(service.getSelectedTwitterProviderIds('Account1')).to.deep.equal(['inboxTwitterMentionsAccount1']);
      });

    });

  });

  describe('The inboxFilteringAwareInfiniteScroll service', function() {

    var $scope, service, INBOX_EVENTS;

    beforeEach(inject(function(inboxFilteringAwareInfiniteScroll, $rootScope, _INBOX_EVENTS_) {
      service = inboxFilteringAwareInfiniteScroll;
      INBOX_EVENTS = _INBOX_EVENTS_;

      $scope = $rootScope.$new();
    }));

    afterEach(function() {
      $scope.$destroy();
    });

    it('should publish available filters as scope.filters', function() {
      service($scope, function() {
        return { id: 'filter' };
      }, function() { return angular.noop; });

      expect($scope.filters).to.deep.equal({ id: 'filter'});
    });

    it('should initialize the scope.loadMoreElements function, calling the passed-in builder', function() {
      var spy = sinon.spy();

      service($scope, function() {
        return { id: 'filter' };
      }, spy);

      expect($scope.loadMoreElements).to.be.a('function');
      expect(spy).to.have.been.calledWith();
    });

    it('should listen to "inbox.filterChanged" event, refreshing the loadMoreElements function and loading first batch of items', function() {
      var loadMoreElements = sinon.spy(function() {
        return function() {
          return $q.when([]);
        };
      });
      var spy = sinon.spy(loadMoreElements);

      service($scope, function() {
        return { id: 'filter' };
      }, spy);

      $scope.$emit(INBOX_EVENTS.FILTER_CHANGED);

      expect($scope.loadMoreElements).to.be.a('function');
      expect(spy).to.have.been.calledTwice; // 1 at init time, 1 after the event is fired
      expect(loadMoreElements).to.have.been.calledWith(); // To load the list when the event is fired
    });

    it('should listen to "inbox.filterChanged" event, resetting infinite scroll', function() {
      var loadMoreElements = sinon.spy(function() {
        return function() {
          return $q.when([]);
        };
      });
      var spy = sinon.spy(loadMoreElements);

      service($scope, function() {
        return { id: 'filter' };
      }, spy);
      // Simulate end of initial infinite scroll
      $scope.infiniteScrollCompleted = true;
      $scope.infiniteScrollDisabled = true;

      $scope.$emit(INBOX_EVENTS.FILTER_CHANGED);

      expect($scope.infiniteScrollCompleted).to.equal(false);

      $scope.$digest();

      expect($scope.infiniteScrollDisabled).to.equal(false);
      expect($scope.infiniteScrollCompleted).to.equal(true); // Because the infinite scroll is done as I'm returning no items
    });
  });

  describe('The inboxSelectionService factory', function() {

    var inboxSelectionService;

    beforeEach(inject(function(_inboxSelectionService_) {
      inboxSelectionService = _inboxSelectionService_;
    }));

    describe('The isSelecting function', function() {

      it('should return false when no items are selected', function() {
        expect(inboxSelectionService.isSelecting()).to.equal(false);
      });

      it('should return true when at least one item is selected', function() {
        inboxSelectionService.toggleItemSelection({});

        expect(inboxSelectionService.isSelecting()).to.equal(true);
      });

    });

    describe('The getSelectedItems function', function() {

      it('should return an empty array when no items are selected', function() {
        expect(inboxSelectionService.getSelectedItems()).to.deep.equal([]);
      });

      it('should return the selected items when at least one item is selected', function() {
        inboxSelectionService.toggleItemSelection({ id: 1 });
        inboxSelectionService.toggleItemSelection({ id: 2 });

        expect(inboxSelectionService.getSelectedItems()).to.deep.equal([
          { id: 1, selected: true },
          { id: 2, selected: true }
        ]);
      });

      it('should return a clone of the selected elements', function() {
        inboxSelectionService.toggleItemSelection({ id: 1 });
        inboxSelectionService.toggleItemSelection({ id: 2 });

        var selectedItems = inboxSelectionService.getSelectedItems();

        inboxSelectionService.unselectAllItems();
        expect(selectedItems).to.shallowDeepEqual([
          { id: 1, selected: false },
          { id: 2, selected: false }
        ]);
      });

    });

    describe('The unselectAllItems function', function() {

      it('should unselect all items', function() {
        var item1 = { id: 1 },
            item2 = { id: 2 };

        inboxSelectionService.toggleItemSelection(item1);
        inboxSelectionService.toggleItemSelection(item2);
        inboxSelectionService.unselectAllItems();

        expect(item1).to.deep.equal({ id: 1, selected: false });
        expect(item2).to.deep.equal({ id: 2, selected: false });
        expect(inboxSelectionService.getSelectedItems()).to.deep.equal([]);
      });

    });

    describe('The toggleItemSelection function', function() {

      it('should select an unselected item, when called with a single argument', function() {
        inboxSelectionService.toggleItemSelection({ id: 1 });

        expect(inboxSelectionService.getSelectedItems()).to.deep.equal([{ id: 1, selected: true }]);
      });

      it('should unselect an selected item, when called with a single argument', function() {
        var item1 = { id: 1, selected: true };

        inboxSelectionService.toggleItemSelection(item1);

        expect(item1).to.deep.equal({ id: 1, selected: false });
        expect(inboxSelectionService.getSelectedItems()).to.deep.equal([]);
      });

      it('should select an item, when called with true as the second argument', function() {
        var item1 = { id: 1 };

        inboxSelectionService.toggleItemSelection(item1, true);

        expect(inboxSelectionService.getSelectedItems()).to.deep.equal([{ id: 1, selected: true }]);
      });

      it('should unselect an item, when called with false as the second argument', function() {
        inboxSelectionService.toggleItemSelection({ id: 1, selected: true }, false);

        expect(inboxSelectionService.getSelectedItems()).to.deep.equal([]);
      });

    });

  });

  describe('The inboxAsyncHostedMailControllerHelper factory', function() {

    var $rootScope, inboxAsyncHostedMailControllerHelper, ctrl, INBOX_CONTROLLER_LOADING_STATES;

    function qWhen() {
      return $q.when(0);
    }

    function qReject() {
      return $q.reject('WTF');
    }

    beforeEach(inject(function(_$rootScope_, _inboxAsyncHostedMailControllerHelper_, session, _INBOX_CONTROLLER_LOADING_STATES_) {
      session.user = {
        preferredEmail: 'user@example.org'
      };

      ctrl = {};

      $rootScope = _$rootScope_;
      inboxAsyncHostedMailControllerHelper = _inboxAsyncHostedMailControllerHelper_;
      INBOX_CONTROLLER_LOADING_STATES = _INBOX_CONTROLLER_LOADING_STATES_;
    }));

    it('should define controller.account using the hosted account email address', function() {
      inboxAsyncHostedMailControllerHelper(ctrl, qWhen);

      expect(ctrl.account).to.deep.equal({
        name: 'user@example.org'
      });
    });

    it('should define controller.state to LOADING', function() {
      inboxAsyncHostedMailControllerHelper(ctrl, qWhen);

      expect(ctrl.state).to.equal(INBOX_CONTROLLER_LOADING_STATES.LOADING);
    });

    it('should run the action, set state to LOADED and resolve on success', function(done) {
      inboxAsyncHostedMailControllerHelper(ctrl, qWhen).then(function(value) {
        expect(ctrl.state).to.equal(INBOX_CONTROLLER_LOADING_STATES.LOADED);
        expect(value).to.equal(0);

        done();
      });

      $rootScope.$digest();
    });

    it('should run the action, set state to ERROR and reject on failure', function(done) {
      inboxAsyncHostedMailControllerHelper(ctrl, qReject).catch(function(err) {
        expect(ctrl.state).to.equal(INBOX_CONTROLLER_LOADING_STATES.ERROR);
        expect(err).to.equal('WTF');

        done();
      });

      $rootScope.$digest();
    });

    it('should define controller.load which resets the state and runs the action again', function() {
      inboxAsyncHostedMailControllerHelper(ctrl, qReject);

      $rootScope.$digest();
      expect(ctrl.state).to.equal(INBOX_CONTROLLER_LOADING_STATES.ERROR);

      ctrl.load();
      expect(ctrl.state).to.equal(INBOX_CONTROLLER_LOADING_STATES.LOADING);

      $rootScope.$digest();
      expect(ctrl.state).to.equal(INBOX_CONTROLLER_LOADING_STATES.ERROR);
    });

  });

});
