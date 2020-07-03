const ICAL = require('@linagora/ical.js');
const sinon = require('sinon');
const { expect } = require('chai');

describe('The contacts backend/lib/pubsub module', function() {
  let pubsubMock, messageMock;
  let userId, contactId, bookId, bookName;
  let getModule;
  let messagingGetSpy, triggerMessaging;
  let CONSTANTS;

  beforeEach(function() {
    this.moduleHelpers.backendPath = `${this.moduleHelpers.modulesPath}linagora.esn.contact/backend/`;
    CONSTANTS = require(`${this.moduleHelpers.backendPath}lib/constants`);
    getModule = () => require(`${this.moduleHelpers.backendPath}lib/pubsub`)(this.moduleHelpers.dependencies);

    pubsubMock = {
      local: {
        topic: sinon.stub().returns({ publish() {} })
      },
      global: {
        topic: sinon.stub().returns({ publish() {} })
      }
    };

    triggerMessaging = {};
    messagingGetSpy = sinon.spy(function(topic) {
      return {
        receive: handler => {
          triggerMessaging[topic] = handler;
        }
      };
    });

    this.moduleHelpers.addDep('pubsub', pubsubMock);
    this.moduleHelpers.addDep('messaging', {
      pointToPoint: {
        get: messagingGetSpy
      }
    });

    userId = 'userId';
    contactId = 'contactId';
    bookId = 'bookId';
    bookName = 'bookName';

    messageMock = {
      path: `addressbooks/${bookId}/${bookName}/${contactId}.vcf`,
      owner: `principals/users/${userId}`,
      carddata: 'BEGIN:VCARD\r\nVERSION:4.0\r\nEMAIL;TYPE=Work:sang@email.com\r\nUID:a0d1277b-23e4-4601-b975-5aa181ca4f3d\r\nFN:Sang\r\nEND:VCARD\r\n'
    };
  });

  it('should subscribe point to point messages for contact events', function() {
    getModule().listen();

    expect(messagingGetSpy).to.have.been.callCount(9);
    expect(messagingGetSpy).to.have.been.calledWith(CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_CREATED);
    expect(messagingGetSpy).to.have.been.calledWith(CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_UPDATED);
    expect(messagingGetSpy).to.have.been.calledWith(CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_DELETED);
    expect(messagingGetSpy).to.have.been.calledWith(CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_CREATED);
    expect(messagingGetSpy).to.have.been.calledWith(CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_DELETED);
    expect(messagingGetSpy).to.have.been.calledWith(CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_UPDATED);
    expect(messagingGetSpy).to.have.been.calledWith(CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_SUBSCRIPTION_DELETED);
    expect(messagingGetSpy).to.have.been.calledWith(CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_SUBSCRIPTION_UPDATED);
    expect(messagingGetSpy).to.have.been.calledWith(CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_SUBSCRIPTION_CREATED);
  });

  describe('On CONTACT_CREATED event', function() {
    it('should publish event CONTACT_ADDED through global pubsub', function(done) {
      pubsubMock.global.topic.withArgs(CONSTANTS.NOTIFICATIONS.CONTACT_ADDED).returns({
        publish(data) {
          expect(data).to.shallowDeepEqual({
            userId,
            contactId,
            bookId,
            bookName
          });
          expect(data.vcard).to.be.an.instanceof(ICAL.Component);
          done();
        }
      });

      getModule().listen();
      triggerMessaging[CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_CREATED](messageMock);
    });

    it('should publish event ELASTICSEARCH_EVENTS.CONTACT_ADDED through local pubsub', function(done) {
      pubsubMock.local.topic.withArgs(CONSTANTS.ELASTICSEARCH_EVENTS.CONTACT_ADDED).returns({
        publish(data) {
          expect(data).to.shallowDeepEqual({
            userId,
            contactId,
            bookId,
            bookName
          });
          expect(data.vcard).to.be.an.instanceof(ICAL.Component);
          done();
        }
      });

      getModule().listen();
      triggerMessaging[CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_CREATED](messageMock);
    });

    it('should not publish event ELASTICSEARCH_EVENTS.CONTACT_ADDED if message contains sourcePath', function() {
      messageMock.sourcePath = 'addressbooks/sourceABH/sourceABN/contcat.vcf';

      getModule().listen();
      triggerMessaging[CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_CREATED](messageMock);

      expect(pubsubMock.local.topic).to.not.have.been.calledWith(CONSTANTS.ELASTICSEARCH_EVENTS.CONTACT_ADDED);
    });

    it('should not publish event ELASTICSEARCH_EVENTS.CONTACT_ADDED if message contains groupAddressBook', function() {
      messageMock.groupAddressBook = true;

      getModule().listen();
      triggerMessaging[CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_CREATED](messageMock);

      expect(pubsubMock.local.topic).to.not.have.been.calledWith(CONSTANTS.ELASTICSEARCH_EVENTS.CONTACT_ADDED);
    });

    it('should not publish event ELASTICSEARCH_EVENTS.CONTACT_ADDED if message does not contain contact path', function() {
      delete messageMock.path;

      getModule().listen();
      triggerMessaging[CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_CREATED](messageMock);

      expect(pubsubMock.local.topic).to.not.have.been.calledWith(CONSTANTS.ELASTICSEARCH_EVENTS.CONTACT_ADDED);
    });

    it('should not publish event ELASTICSEARCH_EVENTS.CONTACT_ADDED if contact path is invalid', function() {
      messageMock.path = '/';

      getModule().listen();
      triggerMessaging[CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_CREATED](messageMock);

      expect(pubsubMock.local.topic).to.not.have.been.calledWith(CONSTANTS.ELASTICSEARCH_EVENTS.CONTACT_ADDED);
    });
  });

  describe('On CONTACT_UPDATED event', function() {
    it('should publish event CONTACT_UPDATED through global pubsub', function(done) {
      pubsubMock.global.topic.withArgs(CONSTANTS.NOTIFICATIONS.CONTACT_UPDATED).returns({
        publish(data) {
          expect(data).to.shallowDeepEqual({
            userId,
            contactId,
            bookId,
            bookName
          });
          expect(data.vcard).to.be.an.instanceof(ICAL.Component);
          done();
        }
      });

      getModule().listen();
      triggerMessaging[CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_UPDATED](messageMock);
    });

    it('should publish event ELASTICSEARCH_EVENTS.CONTACT_UPDATED through local pubsub', function(done) {
      pubsubMock.local.topic.withArgs(CONSTANTS.ELASTICSEARCH_EVENTS.CONTACT_UPDATED).returns({
        publish(data) {
          expect(data).to.shallowDeepEqual({
            userId,
            contactId,
            bookId,
            bookName
          });
          expect(data.vcard).to.be.an.instanceof(ICAL.Component);
          done();
        }
      });

      getModule().listen();
      triggerMessaging[CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_UPDATED](messageMock);
    });

    it('should not publish event ELASTICSEARCH_EVENTS.CONTACT_UPDATED if message contains sourcePath', function() {
      messageMock.sourcePath = 'addressbooks/sourceABH/sourceABN/contcat.vcf';

      getModule().listen();
      triggerMessaging[CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_UPDATED](messageMock);

      expect(pubsubMock.local.topic).to.not.have.been.calledWith(CONSTANTS.ELASTICSEARCH_EVENTS.CONTACT_UPDATED);
    });

    it('should not publish event ELASTICSEARCH_EVENTS.CONTACT_UPDATED if message contains sourcePath', function() {
      messageMock.groupAddressBook = true;

      getModule().listen();
      triggerMessaging[CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_UPDATED](messageMock);

      expect(pubsubMock.local.topic).to.not.have.been.calledWith(CONSTANTS.ELASTICSEARCH_EVENTS.CONTACT_UPDATED);
    });

    it('should not publish event ELASTICSEARCH_EVENTS.CONTACT_UPDATED if message does not contain contact path', function() {
      delete messageMock.path;

      getModule().listen();
      triggerMessaging[CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_UPDATED](messageMock);

      expect(pubsubMock.local.topic).to.not.have.been.calledWith(CONSTANTS.ELASTICSEARCH_EVENTS.CONTACT_UPDATED);
    });

    it('should not publish event ELASTICSEARCH_EVENTS.CONTACT_UPDATED if contact path is invalid', function() {
      messageMock.path = '/';

      getModule().listen();
      triggerMessaging[CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_UPDATED](messageMock);

      expect(pubsubMock.local.topic).to.not.have.been.calledWith(CONSTANTS.ELASTICSEARCH_EVENTS.CONTACT_UPDATED);
    });
  });

  describe('On CONTACT_DELETED event', function() {
    it('should publish event CONTACT_DELETED through global pubsub', function(done) {
      pubsubMock.global.topic.withArgs(CONSTANTS.NOTIFICATIONS.CONTACT_DELETED).returns({
        publish(data) {
          expect(data).to.shallowDeepEqual({
            contactId,
            bookId,
            bookName
          });
          done();
        }
      });

      getModule().listen();
      triggerMessaging[CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_DELETED](messageMock);
    });

    it('should publish event ELASTICSEARCH_EVENTS.CONTACT_DELETED through local pubsub', function(done) {
      pubsubMock.local.topic.withArgs(CONSTANTS.ELASTICSEARCH_EVENTS.CONTACT_DELETED).returns({
        publish(data) {
          expect(data).to.shallowDeepEqual({
            userId,
            contactId,
            bookId,
            bookName
          });
          expect(data.vcard).to.be.an.instanceof(ICAL.Component);
          done();
        }
      });

      getModule().listen();
      triggerMessaging[CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_DELETED](messageMock);
    });

    it('should not publish event ELASTICSEARCH_EVENTS.CONTACT_DELETED if message contains sourcePath', function() {
      messageMock.sourcePath = 'addressbooks/sourceABH/sourceABN/contcat.vcf';

      getModule().listen();
      triggerMessaging[CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_DELETED](messageMock);

      expect(pubsubMock.local.topic).to.not.have.been.calledWith(CONSTANTS.ELASTICSEARCH_EVENTS.CONTACT_DELETED);
    });
    it('should not publish event ELASTICSEARCH_EVENTS.CONTACT_DELETED if message contains sourcePath', function() {
      messageMock.groupAddressBook = true;

      getModule().listen();
      triggerMessaging[CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_DELETED](messageMock);

      expect(pubsubMock.local.topic).to.not.have.been.calledWith(CONSTANTS.ELASTICSEARCH_EVENTS.CONTACT_DELETED);
    });

    it('should not publish event ELASTICSEARCH_EVENTS.CONTACT_DELETED if message does not contain contact path', function() {
      delete messageMock.path;

      getModule().listen();
      triggerMessaging[CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_DELETED](messageMock);

      expect(pubsubMock.local.topic).to.not.have.been.calledWith(CONSTANTS.ELASTICSEARCH_EVENTS.CONTACT_DELETED);
    });

    it('should not publish event ELASTICSEARCH_EVENTS.CONTACT_DELETED if contact path is invalid', function() {
      messageMock.path = '/';

      getModule().listen();
      triggerMessaging[CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_DELETED](messageMock);

      expect(pubsubMock.local.topic).to.not.have.been.calledWith(CONSTANTS.ELASTICSEARCH_EVENTS.CONTACT_DELETED);
    });
  });

  describe('On ADDRESSBOOK_CREATED event', function() {
    it('should publish event ADDRESSBOOK_CREATED through global pubsub', function(done) {
      messageMock = {
        path: `addressbooks/${bookId}/${bookName}`,
        owner: `principals/users/${userId}`
      };
      pubsubMock.global.topic.withArgs(CONSTANTS.NOTIFICATIONS.ADDRESSBOOK_CREATED).returns({
        publish(data) {
          expect(data).to.shallowDeepEqual({
            userId,
            bookId,
            bookName
          });
          done();
        }
      });

      getModule().listen();
      triggerMessaging[CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_CREATED](messageMock);
    });
  });

  describe('On ADDRESSBOOK_DELETED event', function() {
    it('should publish event ADDRESSBOOK_DELETED through global pubsub', function(done) {
      messageMock = {
        path: `addressbooks/${bookId}/${bookName}`,
        owner: `principals/users/${userId}`
      };
      pubsubMock.global.topic.withArgs(CONSTANTS.NOTIFICATIONS.ADDRESSBOOK_DELETED).returns({
        publish(data) {
          expect(data).to.shallowDeepEqual({
            userId,
            bookId,
            bookName
          });
          done();
        }
      });

      getModule().listen();
      triggerMessaging[CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_DELETED](messageMock);
    });
  });

  describe('On ADDRESSBOOK_UPDATED event', function() {
    it('should publish event ADDRESSBOOK_UPDATED through global pubsub', function(done) {
      messageMock = {
        path: `addressbooks/${bookId}/${bookName}`
      };
      pubsubMock.global.topic.withArgs(CONSTANTS.NOTIFICATIONS.ADDRESSBOOK_UPDATED).returns({
        publish(data) {
          expect(data).to.shallowDeepEqual({
            bookId,
            bookName
          });
          done();
        }
      });

      getModule().listen();
      triggerMessaging[CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_UPDATED](messageMock);
    });
  });

  describe('On ADDRESSBOOK_SUBSCRIPTION_DELETED event', function() {
    it('should publish event ADDRESSBOOK_SUBSCRIPTION_DELETED through global pubsub', function(done) {
      messageMock = {
        path: `addressbooks/${bookId}/${bookName}`,
        owner: `principals/users/${userId}`
      };
      pubsubMock.global.topic.withArgs(CONSTANTS.NOTIFICATIONS.ADDRESSBOOK_SUBSCRIPTION_DELETED).returns({
        publish(data) {
          expect(data).to.shallowDeepEqual({
            userId,
            bookId,
            bookName
          });
          done();
        }
      });

      getModule().listen();
      triggerMessaging[CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_SUBSCRIPTION_DELETED](messageMock);
    });
  });

  describe('On ADDRESSBOOK_SUBSCRIPTION_UPDATED event', function() {
    it('should publish event ADDRESSBOOK_SUBSCRIPTION_UPDATED through global pubsub', function(done) {
      messageMock = {
        path: `addressbooks/${bookId}/${bookName}`
      };
      pubsubMock.global.topic.withArgs(CONSTANTS.NOTIFICATIONS.ADDRESSBOOK_SUBSCRIPTION_UPDATED).returns({
        publish(data) {
          expect(data).to.shallowDeepEqual({
            bookId,
            bookName
          });
          done();
        }
      });

      getModule().listen();
      triggerMessaging[CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_SUBSCRIPTION_UPDATED](messageMock);
    });
  });

  describe('On ADDRESSBOOK_SUBSCRIPTION_CREATED event', function() {
    it('should publish event ADDRESSBOOK_SUBSCRIPTION_CREATED through global pubsub', function(done) {
      messageMock = {
        path: `addressbooks/${bookId}/${bookName}`
      };
      pubsubMock.global.topic.withArgs(CONSTANTS.NOTIFICATIONS.ADDRESSBOOK_SUBSCRIPTION_CREATED).returns({
        publish(data) {
          expect(data).to.shallowDeepEqual({
            bookId,
            bookName
          });
          done();
        }
      });

      getModule().listen();
      triggerMessaging[CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_SUBSCRIPTION_CREATED](messageMock);
    });
  });
});
