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
  });

  describe('On CONTACT_MOVED event', function() {
    it('should publish event CONTACT_UPDATED through local pubsub', function(done) {
      messageMock.toPath = 'addressbooks/newBookId/newBookName/newContactId.vcf';

      pubsubMock.global.topic.withArgs(CONSTANTS.GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_MOVED).returns({
        subscribe(listener) {
          listener(messageMock);
        }
      });
      pubsubMock.local.topic.withArgs(CONSTANTS.NOTIFICATIONS.CONTACT_UPDATED).returns({
        publish(data) {
          expect(data).to.shallowDeepEqual({
            userId,
            contactId: 'newContactId',
            bookId: 'newBookId',
            bookName: 'newBookName'
          });
          expect(data.vcard).to.be.an.instanceof(ICAL.Component);
          done();
        }
      });

      getModule().listen();
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
  });
});
