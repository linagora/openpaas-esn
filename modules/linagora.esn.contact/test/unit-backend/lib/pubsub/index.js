'use strict';

const ICAL = require('@linagora/ical.js');
const sinon = require('sinon');
const chai = require('chai');
const expect = chai.expect;

describe('The contacts backend/lib/pubsub module', function() {
  let pubsubMock, messageMock, userId, contactId, bookId, bookName;
  let getModule;
  let CONSTANTS;

  beforeEach(function() {
    this.moduleHelpers.backendPath = `${this.moduleHelpers.modulesPath}linagora.esn.contact/backend/`;
    CONSTANTS = require(`${this.moduleHelpers.backendPath}lib/constants`);
    getModule = () => require(`${this.moduleHelpers.backendPath}lib/pubsub`)(this.moduleHelpers.dependencies);

    pubsubMock = {
      global: {
        topic: sinon.stub().returns({ subscribe() {} })
      },
      local: {
        topic: sinon.stub().returns({ publish() {} })
      }
    };
    this.moduleHelpers.addDep('pubsub', pubsubMock);

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

  describe('On CONTACT_CREATED event', function() {
    it('should publish event CONTACT_ADDED through local pubsub', function(done) {
      pubsubMock.global.topic.withArgs(CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_CREATED).returns({
        subscribe(listener) {
          listener(messageMock);
        }
      });
      pubsubMock.local.topic.withArgs(CONSTANTS.NOTIFICATIONS.CONTACT_ADDED).returns({
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
    });

    it('should publish event ELASTICSEARCH_EVENTS.CONTACT_ADDED through local pubsub', function(done) {
      pubsubMock.global.topic.withArgs(CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_CREATED).returns({
        subscribe(listener) {
          listener(messageMock);
        }
      });
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
    });

    it('should not publish event ELASTICSEARCH_EVENTS.CONTACT_ADDED if message contains sourcePath', function() {
      pubsubMock.global.topic.withArgs(CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_CREATED).returns({
        subscribe(listener) {
          listener(messageMock);
        }
      });

      messageMock.sourcePath = 'addressbooks/sourceABH/sourceABN/contcat.vcf';

      getModule().listen();

      expect(pubsubMock.local.topic).to.not.have.been.calledWith(CONSTANTS.ELASTICSEARCH_EVENTS.CONTACT_ADDED);
    });

    it('should not publish event ELASTICSEARCH_EVENTS.CONTACT_ADDED if message does not contain contact path', function() {
      pubsubMock.global.topic.withArgs(CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_ADDED).returns({
        subscribe(listener) {
          listener(messageMock);
        }
      });

      delete messageMock.path;

      getModule().listen();

      expect(pubsubMock.local.topic).to.not.have.been.calledWith(CONSTANTS.ELASTICSEARCH_EVENTS.CONTACT_ADDED);
    });

    it('should not publish event ELASTICSEARCH_EVENTS.CONTACT_ADDED if contact path is invalid', function() {
      pubsubMock.global.topic.withArgs(CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_ADDED).returns({
        subscribe(listener) {
          listener(messageMock);
        }
      });

      messageMock.path = '/';

      getModule().listen();

      expect(pubsubMock.local.topic).to.not.have.been.calledWith(CONSTANTS.ELASTICSEARCH_EVENTS.CONTACT_ADDED);
    });
  });

  describe('On CONTACT_UPDATED event', function() {
    it('should publish event CONTACT_UPDATED through local pubsub', function(done) {
      pubsubMock.global.topic.withArgs(CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_UPDATED).returns({
        subscribe(listener) {
          listener(messageMock);
        }
      });
      pubsubMock.local.topic.withArgs(CONSTANTS.NOTIFICATIONS.CONTACT_UPDATED).returns({
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
    });

    it('should publish event ELASTICSEARCH_EVENTS.CONTACT_UPDATED through local pubsub', function(done) {
      pubsubMock.global.topic.withArgs(CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_UPDATED).returns({
        subscribe(listener) {
          listener(messageMock);
        }
      });
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
    });

    it('should not publish event ELASTICSEARCH_EVENTS.CONTACT_UPDATED if message contains sourcePath', function() {
      pubsubMock.global.topic.withArgs(CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_UPDATED).returns({
        subscribe(listener) {
          listener(messageMock);
        }
      });

      messageMock.sourcePath = 'addressbooks/sourceABH/sourceABN/contcat.vcf';

      getModule().listen();

      expect(pubsubMock.local.topic).to.not.have.been.calledWith(CONSTANTS.ELASTICSEARCH_EVENTS.CONTACT_UPDATED);
    });

    it('should not publish event ELASTICSEARCH_EVENTS.CONTACT_UPDATED if message does not contain contact path', function() {
      pubsubMock.global.topic.withArgs(CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_UPDATED).returns({
        subscribe(listener) {
          listener(messageMock);
        }
      });

      delete messageMock.path;

      getModule().listen();

      expect(pubsubMock.local.topic).to.not.have.been.calledWith(CONSTANTS.ELASTICSEARCH_EVENTS.CONTACT_UPDATED);
    });

    it('should not publish event ELASTICSEARCH_EVENTS.CONTACT_UPDATED if contact path is invalid', function() {
      pubsubMock.global.topic.withArgs(CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_UPDATED).returns({
        subscribe(listener) {
          listener(messageMock);
        }
      });

      messageMock.path = '/';

      getModule().listen();

      expect(pubsubMock.local.topic).to.not.have.been.calledWith(CONSTANTS.ELASTICSEARCH_EVENTS.CONTACT_UPDATED);
    });
  });

  describe('On CONTACT_DELETED event', function() {
    it('should publish event CONTACT_DELETED through local pubsub', function(done) {
      pubsubMock.global.topic.withArgs(CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_DELETED).returns({
        subscribe(listener) {
          listener(messageMock);
        }
      });
      pubsubMock.local.topic.withArgs(CONSTANTS.NOTIFICATIONS.CONTACT_DELETED).returns({
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
    });

    it('should publish event ELASTICSEARCH_EVENTS.CONTACT_DELETED through local pubsub', function(done) {
      pubsubMock.global.topic.withArgs(CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_DELETED).returns({
        subscribe(listener) {
          listener(messageMock);
        }
      });
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
    });

    it('should not publish event ELASTICSEARCH_EVENTS.CONTACT_DELETED if message contains sourcePath', function() {
      pubsubMock.global.topic.withArgs(CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_DELETED).returns({
        subscribe(listener) {
          listener(messageMock);
        }
      });

      messageMock.sourcePath = 'addressbooks/sourceABH/sourceABN/contcat.vcf';

      getModule().listen();

      expect(pubsubMock.local.topic).to.not.have.been.calledWith(CONSTANTS.ELASTICSEARCH_EVENTS.CONTACT_DELETED);
    });

    it('should not publish event ELASTICSEARCH_EVENTS.CONTACT_DELETED if message does not contain contact path', function() {
      pubsubMock.global.topic.withArgs(CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_DELETED).returns({
        subscribe(listener) {
          listener(messageMock);
        }
      });

      delete messageMock.path;

      getModule().listen();

      expect(pubsubMock.local.topic).to.not.have.been.calledWith(CONSTANTS.ELASTICSEARCH_EVENTS.CONTACT_DELETED);
    });

    it('should not publish event ELASTICSEARCH_EVENTS.CONTACT_DELETED if contact path is invalid', function() {
      pubsubMock.global.topic.withArgs(CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_DELETED).returns({
        subscribe(listener) {
          listener(messageMock);
        }
      });

      messageMock.path = '/';

      getModule().listen();

      expect(pubsubMock.local.topic).to.not.have.been.calledWith(CONSTANTS.ELASTICSEARCH_EVENTS.CONTACT_DELETED);
    });
  });

  describe('On ADDRESSBOOK_CREATED event', function() {
    it('should publish event ADDRESSBOOK_CREATED through local pubsub', function(done) {
      messageMock = {
        path: `addressbooks/${bookId}/${bookName}`,
        owner: `principals/users/${userId}`
      };
      pubsubMock.global.topic.withArgs(CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_CREATED).returns({
        subscribe(listener) {
          listener(messageMock);
        }
      });
      pubsubMock.local.topic.withArgs(CONSTANTS.NOTIFICATIONS.ADDRESSBOOK_CREATED).returns({
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
    });
  });

  describe('On ADDRESSBOOK_DELETED event', function() {
    it('should publish event ADDRESSBOOK_DELETED through local pubsub', function(done) {
      messageMock = {
        path: `addressbooks/${bookId}/${bookName}`,
        owner: `principals/users/${userId}`
      };
      pubsubMock.global.topic.withArgs(CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_DELETED).returns({
        subscribe(listener) {
          listener(messageMock);
        }
      });
      pubsubMock.local.topic.withArgs(CONSTANTS.NOTIFICATIONS.ADDRESSBOOK_DELETED).returns({
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
    });
  });

  describe('On ADDRESSBOOK_UPDATED event', function() {
    it('should publish event ADDRESSBOOK_UPDATED through local pubsub', function(done) {
      messageMock = {
        path: `addressbooks/${bookId}/${bookName}`
      };
      pubsubMock.global.topic.withArgs(CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_UPDATED).returns({
        subscribe(listener) {
          listener(messageMock);
        }
      });
      pubsubMock.local.topic.withArgs(CONSTANTS.NOTIFICATIONS.ADDRESSBOOK_UPDATED).returns({
        publish(data) {
          expect(data).to.shallowDeepEqual({
            bookId,
            bookName
          });
          done();
        }
      });

      getModule().listen();
    });
  });

  describe('On ADDRESSBOOK_SUBSCRIPTION_DELETED event', function() {
    it('should publish event ADDRESSBOOK_SUBSCRIPTION_DELETED through local pubsub', function(done) {
      messageMock = {
        path: `addressbooks/${bookId}/${bookName}`,
        owner: `principals/users/${userId}`
      };
      pubsubMock.global.topic.withArgs(CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_SUBSCRIPTION_DELETED).returns({
        subscribe(listener) {
          listener(messageMock);
        }
      });
      pubsubMock.local.topic.withArgs(CONSTANTS.NOTIFICATIONS.ADDRESSBOOK_SUBSCRIPTION_DELETED).returns({
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
    });
  });

  describe('On ADDRESSBOOK_SUBSCRIPTION_UPDATED event', function() {
    it('should publish event ADDRESSBOOK_SUBSCRIPTION_UPDATED through local pubsub', function(done) {
      messageMock = {
        path: `addressbooks/${bookId}/${bookName}`
      };
      pubsubMock.global.topic.withArgs(CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_SUBSCRIPTION_UPDATED).returns({
        subscribe(listener) {
          listener(messageMock);
        }
      });
      pubsubMock.local.topic.withArgs(CONSTANTS.NOTIFICATIONS.ADDRESSBOOK_SUBSCRIPTION_UPDATED).returns({
        publish(data) {
          expect(data).to.shallowDeepEqual({
            bookId,
            bookName
          });
          done();
        }
      });

      getModule().listen();
    });
  });
});
