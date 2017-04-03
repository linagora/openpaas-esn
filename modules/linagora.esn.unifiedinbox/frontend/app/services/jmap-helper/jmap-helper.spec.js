'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The inboxJmapHelper service', function() {

  var inboxJmapHelper, jmap, emailBodyServiceMock, $rootScope, notificationFactory, jmapClient;

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox', function($provide) {
      jmapClient = {};

      $provide.value('withJmapClient', function(callback) {
        return callback(jmapClient);
      });
      $provide.value('emailBodyService', emailBodyServiceMock = { bodyProperty: 'htmlBody' });
      $provide.value('inboxIdentitiesService', {
        getDefaultIdentity: function() {
          return $q.when({ id: 'default', name: 'Default Name', email: 'default@domain.com' });
        }
      });
    });

    angular.mock.inject(function(_$rootScope_, _inboxJmapHelper_, _notificationFactory_, _jmap_) {
      inboxJmapHelper = _inboxJmapHelper_;
      jmap = _jmap_;
      $rootScope = _$rootScope_;
      notificationFactory = _notificationFactory_;

      notificationFactory.weakError = sinon.spy();
    });
  });

  describe('The getMessageById function', function() {

    it('should fetch the message, and reject upon failure', function(done) {
      jmapClient.getMessages = function(options) {
        expect(options.ids).to.deep.equal(['id']);

        return $q.reject();
      };

      inboxJmapHelper.getMessageById('id').then(null, done);
      $rootScope.$digest();
    });

    it('should fetch the message, and return it upon success', function(done) {
      jmapClient.getMessages = function(options) {
        expect(options.ids).to.deep.equal(['id']);

        return $q.when([{ id: 'id' }]);
      };

      inboxJmapHelper.getMessageById('id').then(function(message) {
        expect(message).to.deep.equal({ id: 'id' });

        done();
      });
      $rootScope.$digest();
    });

  });

  describe('The toOutboundMessage fn', function() {

    it('should build and return new instance of jmap.OutboundMessage', function() {
      inboxJmapHelper.toOutboundMessage({}, {
        identity: {
          name: 'Alice Cooper',
          email: 'alice@domain'
        },
        subject: 'expected subject',
        htmlBody: 'expected htmlBody',
        to: [{email: 'to@domain', name: 'to'}],
        cc: [{email: 'cc@domain', name: 'cc'}],
        bcc: [{email: 'bcc@domain', name: 'bcc'}]
      }).then(function(message) {
        expect(message).to.deep.equal(new jmap.OutboundMessage({}, {
          from: new jmap.EMailer({
            name: 'Alice Cooper',
            email: 'alice@domain'
          }),
          replyTo: null,
          subject: 'expected subject',
          htmlBody: 'expected htmlBody',
          to: [new jmap.EMailer({email: 'to@domain', name: 'to'})],
          cc: [new jmap.EMailer({email: 'cc@domain', name: 'cc'})],
          bcc: [new jmap.EMailer({email: 'bcc@domain', name: 'bcc'})]
        }));
      });
      $rootScope.$digest();
    });

    it('should filter attachments with no blobId', function() {
      inboxJmapHelper.toOutboundMessage({}, {
        identity: {
          name: 'Alice Cooper',
          email: 'alice@domain'
        },
        htmlBody: 'expected htmlBody',
        attachments: [{ blobId: '1' }, { blobId: '' }]
      }).then(function(message) {
        expect(message).to.deep.equal(new jmap.OutboundMessage({}, {
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
      $rootScope.$digest();
    });

    it('should include email.htmlBody when provided', function() {
      emailBodyServiceMock.bodyProperty = 'textBody';

      inboxJmapHelper.toOutboundMessage({}, {
        identity: {
          name: 'Alice Cooper',
          email: 'alice@domain'
        },
        htmlBody: 'expected htmlBody',
        textBody: 'expected textBody'
      }).then(function(message) {
        expect(message.htmlBody).to.equal('expected htmlBody');
        expect(message.textBody).to.be.null;
      });
      $rootScope.$digest();
    });

    it('should leverage emailBodyServiceMock.bodyProperty when emailState.htmlBody is undefined', function() {
      emailBodyServiceMock.bodyProperty = 'textBody';

      inboxJmapHelper.toOutboundMessage({}, {
        identity: {
          name: 'Alice Cooper',
          email: 'alice@domain'
        },
        htmlBody: '',
        textBody: 'expected textBody'
      }).then(function(message) {
        expect(message.htmlBody).to.be.null;
        expect(message.textBody).to.equal('expected textBody');
      });
      $rootScope.$digest();
    });

    it('should set replyTo in the OutboundMessage, if defined in the identity', function() {
      inboxJmapHelper.toOutboundMessage({}, {
        identity: {
          name: 'Alice Cooper',
          email: 'alice@domain',
          replyTo: 'bob@domain'
        },
        to: [{email: 'to@domain', name: 'to'}]
      }).then(function(message) {
        expect(message).to.deep.equal(new jmap.OutboundMessage({}, {
          from: new jmap.EMailer({
            name: 'Alice Cooper',
            email: 'alice@domain'
          }),
          replyTo: [new jmap.EMailer({ email: 'bob@domain' })],
          to: [new jmap.EMailer({email: 'to@domain', name: 'to'})],
          subject: null,
          htmlBody: null,
          cc: [],
          bcc: []
        }));
      });
      $rootScope.$digest();
    });

    it('should use default identity if none defined at the message level', function() {
      inboxJmapHelper.toOutboundMessage({}, {
        to: [{email: 'to@domain', name: 'to'}]
      }).then(function(message) {
        expect(message).to.deep.equal(new jmap.OutboundMessage({}, {
          from: new jmap.EMailer({
            name: 'Default Name',
            email: 'default@domain.com'
          }),
          replyTo: null,
          to: [new jmap.EMailer({email: 'to@domain', name: 'to'})],
          subject: null,
          htmlBody: null,
          cc: [],
          bcc: []
        }));
      });
      $rootScope.$digest();
    });

  });

});
