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
    });

    angular.mock.inject(function(session, _$rootScope_, _inboxJmapHelper_, _notificationFactory_, _jmap_) {
      inboxJmapHelper = _inboxJmapHelper_;
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
      expect(inboxJmapHelper.toOutboundMessage({}, {
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
        to: [new jmap.EMailer({email: 'to@domain', name: 'to'})],
        cc: [new jmap.EMailer({email: 'cc@domain', name: 'cc'})],
        bcc: [new jmap.EMailer({email: 'bcc@domain', name: 'bcc'})]
      }));
    });

    it('should filter attachments with no blobId', function() {
      expect(inboxJmapHelper.toOutboundMessage({}, {
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

      var message = inboxJmapHelper.toOutboundMessage({}, {
        htmlBody: 'expected htmlBody',
        textBody: 'expected textBody'
      });

      expect(message.htmlBody).to.equal('expected htmlBody');
      expect(message.textBody).to.be.null;
    });

    it('should leverage emailBodyServiceMock.bodyProperty when emailState.htmlBody is undefined', function() {
      emailBodyServiceMock.bodyProperty = 'textBody';

      var message = inboxJmapHelper.toOutboundMessage({}, {
        htmlBody: '',
        textBody: 'expected textBody'
      });

      expect(message.htmlBody).to.be.null;
      expect(message.textBody).to.equal('expected textBody');
    });
  });

});
