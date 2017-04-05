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
    $provide.value('inboxIdentitiesService', {
      getAllIdentities: function() {
        return $q.when([{ isDefault: true, id: 'default', name: 'me me', email: 'yo@lo' }]);
      },
      getDefaultIdentity: function() {
        return $q.when({ isDefault: true, id: 'default', name: 'me me', email: 'yo@lo' });
      }
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

    it('should reject when jmapClient cannot be built', function(done) {
      var errorMessage = 'JMAP';
      jmapClientProviderMock.get = function() {
        return $q.reject(new Error(errorMessage));
      };

      withJmapClient(function(client) {
        expect(client).to.equal(null);
      }).catch(function(err) {
        expect(err.message).to.equal(errorMessage);
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

        jmapClientMock.getMailboxes = function() {
          return $q.when([new jmap.Mailbox({}, 'id_outbox', 'name_outbox', { role: 'outbox' })]);
        };

        jmapClientMock.moveMessage = function() {
          return $q.when({});
        };

      });

      it('should use JMAP to send email when JMAP is enabled to send email', function(done) {
        var email = { from: { email: 'A' }, to: [{ email: 'B' }] };
        var messageAck = { id: 'm123' };

        jmapClientMock.saveAsDraft = function() {
          return $q.when(messageAck);
        };

        jmapClientMock.moveMessage = function(messageId, mailboxIds) {
          expect(messageId).to.equal(messageAck.id);
          expect(mailboxIds).to.deep.equal(['id_outbox']);
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
        jmapClientMock.getMailboxes = function() {
          return $q.reject();
        };

        sendEmail({}).then(done.bind(null, 'should reject'), done);
        $rootScope.$digest();
      });

      it('should reject if JMAP client fails to move message to outbox mailbox', function(done) {

        jmapClientMock.moveMessage = function() {
          return $q.reject();
        };

        sendEmail({}).then(done.bind(null, 'should reject'), done);
        $rootScope.$digest();
      });

    });

    describe('Use JMAP but without saving a draft', function() {

      var email, outbox;

      beforeEach(function() {
        email = { to: [{ email: 'B' }] };
        config['linagora.esn.unifiedinbox.isJmapSendingEnabled'] = true;
        config['linagora.esn.unifiedinbox.isSaveDraftBeforeSendingEnabled'] = false;

        outbox = new jmap.Mailbox({}, 'id_outbox', 'name_outbox', { role: 'outbox' });
        jmapClientMock.getMailboxes = function() {
          return $q.when([outbox]);
        };
      });

      it('should use JMAP to send email when JMAP is enabled to send email', function(done) {
        jmapClientMock.send = sinon.stub().returns($q.when('expected return'));

        sendEmail(email).then(function(returnedValue) {
          expect(jmapClientMock.send).to.have.been.calledWithMatch({ to: [{ email: 'B', name: '' }]}, outbox);
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

      angular.mock.inject(function(session, _emailSendingService_, _$rootScope_, $templateCache) {
        emailSendingService = _emailSendingService_;
        $rootScope = _$rootScope_;

        session.user = {
          firstname: 'user',
          lastname: 'using',
          preferredEmail: 'user@linagora.com'
        };

        $templateCache.put('/unifiedinbox/views/partials/quotes/default.txt', '');
        $templateCache.put('/unifiedinbox/views/partials/quotes/forward.txt', '');
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

      it('should return false when zero recipient is provided', function() {

        expect(emailSendingService.showReplyAllButton({})).to.be.false;
      });

      it('should return true when the single recipient is not the user', function() {

        email = {
          to: [{displayName: '1', email: '1@linagora.com'}],
          cc: [],
          bcc: []
        };

        expect(emailSendingService.showReplyAllButton(email)).to.be.true;
      });

      it('should return false when the single recipient is the user', function() {

        email = {
          to: [{displayName: 'user', email: 'user@linagora.com'}],
          cc: [],
          bcc: []
        };

        expect(emailSendingService.showReplyAllButton(email)).to.be.false;
      });
    });

    describe('The getFirstRecipient function', function() {
      var expectedEmail = {displayName: '1', email: '1@linagora.com'};

      it('should return the first recipient', function() {

        email = {
          to: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}],
          cc: [{displayName: '3', email: '3@linagora.com'}, {displayName: '4', email: '4@linagora.com'}],
          bcc: [{displayName: '5', email: '5@linagora.com'}, {displayName: '6', email: '6@linagora.com'}]
        };

        expect(emailSendingService.getFirstRecipient(email)).to.shallowDeepEqual(expectedEmail);
      });

      it('should return undefined if there is zero recipients', function() {

        email = {
          to: [],
          cc: [],
          bcc: []
        };

        expect(emailSendingService.getFirstRecipient(email)).to.be.undefined;
      });

      it('should return the first Cc if there is no To', function() {

        email = {
          to: [],
          cc: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}],
          bcc: [{displayName: '5', email: '5@linagora.com'}]
        };

        expect(emailSendingService.getFirstRecipient(email)).to.shallowDeepEqual(expectedEmail);
      });

      it('should return the first Bcc if there is no To and no Cc', function() {

        email = {
          to: [],
          cc: [],
          bcc: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}]
        };

        expect(emailSendingService.getFirstRecipient(email)).to.shallowDeepEqual(expectedEmail);
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

      it('should create a reply all email object, pre-quoting the original message on mobile', function(done) {
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
          quoted: {
            htmlBody: '<p><br/></p><cite>On 12:00:00 14:00, from sender@linagora.com</cite><blockquote><p>my body</p></blockquote>'
          },
          quoteTemplate: 'default',
          isQuoting: false
        };

        mockGetMessages(email);
        emailSendingService.createReplyAllEmailObject('id', sender).then(function(email) {
          expect(email).to.shallowDeepEqual(expectedAnswer);
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should create a reply all email object, quoting the original message on mobile if the message is plain text', function(done) {
        isMobile = true;
        email = {
          from: {email: 'sender@linagora.com', name: 'linagora'},
          to: [{displayName: '1', email: '1@linagora.com'}],
          subject: 'my subject',
          textBody: 'Body'
        };
        sender = {displayName: 'sender', email: 'sender@linagora.com'};
        expectedAnswer = {
          from: 'sender@linagora.com',
          to: [{displayName: '1', email: '1@linagora.com'}],
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

      it('should create a reply email object, pre-quoting the original message on mobile', function(done) {
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
          quoted: {
            htmlBody: '<p><br/></p><cite>On 12:00:00 14:00, from from@linagora.com</cite><blockquote><p>my body</p></blockquote>'
          },
          quoteTemplate: 'default',
          isQuoting: false
        };

        mockGetMessages(email);
        emailSendingService.createReplyEmailObject('id', sender).then(function(email) {
          expect(email).to.shallowDeepEqual(expectedAnswer);
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should create a reply email object, quoting the original message on mobile if the message is plain text', function(done) {
        isMobile = true;
        email = {
          from: {email: 'from@linagora.com', name: 'linagora'},
          to: [{displayName: '1', email: '1@linagora.com'}],
          subject: 'my subject',
          textBody: 'Body'
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

      it('should create a forward email object, pre-quoting the original message on mobile', function() {
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
          quoted: {
            htmlBody: '<p><br/></p><cite>------- Forwarded message -------<br/>Subject: my subject<br/>Date: 12:00:00 14:00<br/>From: from@linagora.com<br/>To: first <first@linagora.com>, second <second@linagora.com><br/>CC: third <third@linagora.com></cite><blockquote><p>my body</p></blockquote>'
          },
          quoteTemplate: 'forward',
          isQuoting: false
        };

        mockGetMessages(email);
        emailSendingService.createForwardEmailObject('id', sender).then(function(email) {
          expect(email).to.shallowDeepEqual(expectedAnswer);
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should create a forward email object, quoting the original message on mobile if the message is plain text', function() {
        isMobile = true;
        email = {
          from: {email: 'from@linagora.com', name: 'from'},
          to: [{name: 'first', email: 'first@linagora.com'}, {name: 'second', email: 'second@linagora.com'}],
          subject: 'my subject',
          textBody: 'Body'
        };
        sender = {name: 'sender', email: 'sender@linagora.com'};
        expectedAnswer = {
          from: 'sender@linagora.com',
          subject: 'Fwd: my subject',
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

    var draftService, notificationFactory, jmapClient, emailBodyService, $rootScope;

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

    beforeEach(inject(function(_draftService_, _$rootScope_) {
      draftService = _draftService_;
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
        textBody: 'The actual reply',
        quoteTemplate: 'default',
        quoted: {
          from: {
            name: 'test',
            email: 'test@open-paas.org'
          },
          subject: 'Heya',
          date: '2015-08-21T00:10:00Z',
          htmlBody: '<cite>On Aug 21, 2015 12:10:00 AM, from test@open-paas.org</cite><blockquote><p>HtmlBody</p></blockquote>'
        }
      }).send();
      $rootScope.$digest();

      expect(emailSendingService.sendEmail).to.have.been.calledWith(sinon.match({
        htmlBody: '<pre>The actual reply</pre><br/><div><cite>On Aug 21, 2015 12:10:00 AM, from test@open-paas.org</cite><blockquote><p>HtmlBody</p></blockquote></div>'
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

      $templateCache.put('/unifiedinbox/views/partials/quotes/default.txt', 'On {{ email.quoted.date | date:dateFormat:tz }} from {{ email.quoted.from.email }}: {{ email.quoted.textBody }}');
      $templateCache.put('/unifiedinbox/views/partials/quotes/forward.txt',
        '------- Forwarded message ------- ' +
        'Subject: {{ email.quoted.subject }} ' +
        'Date: {{ email.quoted.date | date:dateFormat:tz }} ' +
        '{{ email.quoted.to | emailerList:"To: "}} ' +
        '{{ email.quoted.cc | emailerList:"CC: "}} ' +
        '{{ email.quoted.textBody }}');
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

      function quotedMessage(message) {
        return {
          quoted: message
        };
      }

      it('should quote htmlBody using a richtext template if not on mobile', function(done) {
        emailBodyService.quote(quotedMessage(email))
          .then(function(text) {
            expect(text).to.equal('<p><br/></p><cite>On Aug 21, 2015 12:10:00 AM, from test@open-paas.org</cite><blockquote><p>HtmlBody</p></blockquote>');
          })
          .then(done, done);

        $rootScope.$digest();
      });

      it('should quote textBody using a richtext template if not on mobile and htmlBody is not available', function(done) {
        emailBodyService.quote(quotedMessage(_.omit(email, 'htmlBody')))
          .then(function(text) {
            expect(text).to.equal('<p><br/></p><cite>On Aug 21, 2015 12:10:00 AM, from test@open-paas.org</cite><blockquote>TextBody</blockquote>');
          })
          .then(done, done);

        $rootScope.$digest();
      });

      it('should quote textBody using a plaintext template if on mobile', function(done) {
        isMobile = true;
        emailBodyService.quote(quotedMessage(email))
          .then(function(text) {
            expect(text).to.equal('On Aug 21, 2015 12:10:00 AM from test@open-paas.org: TextBody');
          })
          .then(done, done);

        $rootScope.$digest();
      });

      it('should quote textBody using a richtext template if on mobile and asked to do so', function(done) {
        isMobile = true;
        emailBodyService.quote(quotedMessage(_.omit(email, 'htmlBody')), 'default', true)
          .then(function(text) {
            expect(text).to.equal('<p><br/></p><cite>On Aug 21, 2015 12:10:00 AM, from test@open-paas.org</cite><blockquote>TextBody</blockquote>');
          })
          .then(done, done);

        $rootScope.$digest();
      });

      it('should leverage the rich mode of forward template if specified', function(done) {
        emailBodyService.quote(quotedMessage(email), 'forward')
          .then(function(text) {
            expect(text).to.equal('<p><br/></p><cite>------- Forwarded message -------<br/>Subject: Heya<br/>Date: Aug 21, 2015 12:10:00 AM<br/>From: test@open-paas.org<br/><br/></cite><blockquote><p>HtmlBody</p></blockquote>');
          })
          .then(done, done);

        $rootScope.$digest();
      });

      it('should leverage the text mode of forward template if specified', function(done) {
        isMobile = true;
        emailBodyService.quote(quotedMessage(email), 'forward')
          .then(function(text) {
            expect(text).to.equal('------- Forwarded message ------- Subject: Heya Date: Aug 21, 2015 12:10:00 AM   TextBody');
          })
          .then(done, done);

        $rootScope.$digest();
      });

      it('should quote textBody using a "forward" richtext template if on mobile and asked to do so', function(done) {
        isMobile = true;
        emailBodyService.quote(quotedMessage(_.omit(email, 'htmlBody')), 'forward', true)
          .then(function(text) {
            expect(text).to.equal('<p><br/></p><cite>------- Forwarded message -------<br/>Subject: Heya<br/>Date: Aug 21, 2015 12:10:00 AM<br/>From: test@open-paas.org<br/><br/></cite><blockquote>TextBody</blockquote>');
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

        emailBodyService.quote(quotedMessage(email))
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

        emailBodyService.quote(quotedMessage(email))
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

        emailBodyService.quote(quotedMessage(email), 'forward')
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

        emailBodyService.quote(quotedMessage(email), 'forward')
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

      it('should quote the original email, using htmlBody', function(done) {
        emailBodyService.quoteOriginalEmail(email)
          .then(function(text) {
            expect(text).to.equal('<pre></pre><br/><div><p>HtmlBody</p></div>');
          })
          .then(done, done);

        $rootScope.$digest();
      });

      it('should quote the original email, keeping the already entered text when present', function(done) {
        email.textBody = 'I was previously typed';

        emailBodyService.quoteOriginalEmail(email)
          .then(function(text) {
            expect(text).to.equal('<pre>I was previously typed</pre><br/><div><p>HtmlBody</p></div>');
          })
          .then(done, done);

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

    var $rootScope, _, service, filters, INBOX_EVENTS;

    beforeEach(inject(function(_$rootScope_, inboxFilteringService, inboxFilters, ___, _INBOX_EVENTS_) {
      $rootScope = _$rootScope_;
      service = inboxFilteringService;
      filters = inboxFilters;
      _ = ___;
      INBOX_EVENTS = _INBOX_EVENTS_;
    }));

    afterEach(function() {
      service.uncheckFilters();
    });

    function checkFilter(id) {
      _.find(filters, { id: id }).checked = true;
    }

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

    describe('The setProviderFilters function', function() {

      it('should broadcast an event', function(done) {
        $rootScope.$on(INBOX_EVENTS.FILTER_CHANGED, function() {
          done();
        });

        service.setProviderFilters({});
      });

    });

    describe('The getAvailableFilters function', function() {

      it('should return global filters if no specific type is selected', function() {
        expect(service.getAvailableFilters()).to.deep.equal(_.filter(filters, { isGlobal: true }));
      });

      it('should return matching filters only if a type is selected', function() {
        service.setProviderFilters({ types: ['social'] });

        expect(service.getAvailableFilters()).to.deep.equal(_.filter(filters, { type: 'social' }));
      });

      it('should uncheck non-matching filters', function() {
        _(filters).reject({ isGlobal: true }).forEach(function(filter) {
          filter.checked = true;
        });
        service.getAvailableFilters();

        expect(_(filters).reject({ isGlobal: true }).map('checked').value()).to.deep.equal([false, false]);
      });

    });

    describe('The getAllProviderFilters function', function() {

      it('should build an object containing filters when neither context nor filters are selected', function() {
        expect(service.getAllProviderFilters()).to.deep.equal({
          acceptedIds: null,
          acceptedTypes: null,
          acceptedAccounts: undefined,
          filterByType: {
            jmap: {},
            social: {},
            twitter: {}
          },
          context: undefined
        });
      });

      it('should build an object containing filters when a context is selected', function() {
        service.setProviderFilters({
          types: ['jmap'],
          accounts: ['accountId'],
          context: 'mailboxId'
        });

        expect(service.getAllProviderFilters()).to.deep.equal({
          acceptedIds: null,
          acceptedTypes: ['jmap'],
          acceptedAccounts: ['accountId'],
          filterByType: {
            jmap: {},
            social: {},
            twitter: {}
          },
          context: 'mailboxId'
        });
      });

      it('should build an object containing filters when context and filters are selected', function() {
        service.setProviderFilters({
          types: ['jmap', 'social'],
          accounts: ['accountId'],
          context: 'mailboxId'
        });
        _.find(filters, { id: 'isUnread' }).checked = true;
        _.find(filters, { id: 'isSocial' }).checked = true;

        expect(service.getAllProviderFilters()).to.deep.equal({
          acceptedIds: null,
          acceptedTypes: ['jmap', 'social'],
          acceptedAccounts: ['accountId'],
          filterByType: {
            jmap: {
              isUnread: true
            },
            social: {
              isSocial: true
            },
            twitter: {}
          },
          context: 'mailboxId'
        });
      });

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
