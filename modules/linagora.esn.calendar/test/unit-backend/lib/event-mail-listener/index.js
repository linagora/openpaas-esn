'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const ICAL = require('ical.js');
const Q = require('q');
const mockery = require('mockery');

describe('EventMailListener module', function() {
  let amqpClient, amqpClientProviderMock, userMock, loggerMock, caldavClientMock, caldavClientLib;
  let notifyFunction, jsonMessage, calendarModulePath;

  beforeEach(function() {

    calendarModulePath = this.moduleHelpers.modulesPath + 'linagora.esn.calendar';

    jsonMessage = {
      method: 'REQUEST',
      sender: 'a@b.com',
      recipient: 'admin@open-paas.org',
      uid: 'Test',
      'recurrence-id': '',
      sequence: '1',
      dtstamp: '',
      ical: 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Sabre//Sabre VObject 4.1.2//EN\r\nEND:VCALENDAR\r\n'
    };

    amqpClient = {
      subscribe: (exchange, notifyFn) => {
        notifyFunction = notifyFn;
      }
    };

    amqpClientProviderMock = {
      getClient: () => Q.resolve(amqpClient)
    };

    userMock = {
      findByEmail: (email, cb) => {
        cb(null, {id: 'userId'});
      }
    };

    loggerMock = {
      error: sinon.spy(),
      warn: sinon.spy()
    };

    caldavClientMock = {
      putEvent: sinon.spy(function(userId, calendarURI, eventUID, jsonMessage) {
        return Q.resolve;
      })
    };

    caldavClientLib = function() {
      return caldavClientMock;
    };

    mockery.registerMock('../caldav-client', caldavClientLib);

    this.moduleHelpers.addDep('amqpClientProvider', amqpClientProviderMock);
    this.moduleHelpers.addDep('user', userMock);
    this.moduleHelpers.addDep('logger', loggerMock);

    this.requireModule = function() {
      return require(calendarModulePath + '/backend/lib/event-mail-listener')(this.moduleHelpers.dependencies);
    };
  });

  describe('_checkMandatoryFields function', function() {
    it('should ignore message and log if method is missing', function(done) {
      delete jsonMessage.method;

      this.requireModule()
        .init()
        .then(function() {
          notifyFunction(jsonMessage);

          expect(loggerMock.warn).to.have.been.calledWith('CAlEventMailListener : Missing mandatory field => Event ignored');
          expect(caldavClientMock.putEvent).to.not.have.been.called;

          done();
        }).catch(function(err) {

        done(err || 'Err');
      });
    });

    it('should ignore message and log if sender is missing', function(done) {
      delete jsonMessage.sender;

      this.requireModule()
        .init()
        .then(function() {
          notifyFunction(jsonMessage);

          expect(loggerMock.warn).to.have.been.calledWith('CAlEventMailListener : Missing mandatory field => Event ignored');
          expect(caldavClientMock.putEvent).to.not.have.been.called;

          done();
        }).catch(function(err) {

        done(err || 'Err');
      });
    });

    it('should ignore message and log if recipient is missing', function(done) {
      delete jsonMessage.recipient;

      this.requireModule()
        .init()
        .then(function() {
          notifyFunction(jsonMessage);

          expect(loggerMock.warn).to.have.been.calledWith('CAlEventMailListener : Missing mandatory field => Event ignored');
          expect(caldavClientMock.putEvent).to.not.have.been.called;

          done();
        }).catch(function(err) {

        done(err || 'Err');
      });
    });

    it('should ignore message and log if uid is missing', function(done) {
      delete jsonMessage.uid;

      this.requireModule()
        .init()
        .then(function() {
          notifyFunction(jsonMessage);

          expect(loggerMock.warn).to.have.been.calledWith('CAlEventMailListener : Missing mandatory field => Event ignored');
          expect(caldavClientMock.putEvent).to.not.have.been.called;

          done();
        }).catch(function(err) {

        done(err || 'Err');
      });
    });
  });

  describe('recipient email checks', function() {
    it('should ignore message and log if recipient not found in OP', function(done) {
      userMock.findByEmail = (email, cb) => {
        cb(null, null);
      };

      this.requireModule()
        .init()
        .then(function() {
          notifyFunction(jsonMessage);

          expect(loggerMock.warn).to.have.been.calledWith('CAlEventMailListener : Recipient user unknown in OpenPaas => Event ignored');
          expect(caldavClientMock.putEvent).to.not.have.been.called;

          done();
        }).catch(function(err) {

        done(err || 'Err');
      });
    });

    it('should ignore message and log if userModule fail', function(done) {
      userMock.findByEmail = (email, cb) => {
        cb('Error', null);
      };

      this.requireModule()
        .init()
        .then(function() {
          notifyFunction(jsonMessage);

          expect(loggerMock.error).to.have.been.calledWith('CAlEventMailListener : Could not connect to UserModule => Event ignored');
          expect(caldavClientMock.putEvent).to.not.have.been.called;

          done();
        }).catch(function(err) {

        done(err || 'Err');
      });
    });
  });

  describe('_handleMessage function', function() {
    it('should ignore message and log if method is unknown', function(done) {
      jsonMessage.method = 'TEST';

      this.requireModule()
        .init()
        .then(function() {
          notifyFunction(jsonMessage);

          expect(loggerMock.warn).to.have.been.calledWith('CAlEventMailListener : Unknown method "' + jsonMessage.method + '" => Event ignored');
          expect(caldavClientMock.putEvent).to.not.have.been.called;

          done();
        }).catch(function(err) {

        done(err || 'Err');
      });
    });
  });

  describe('_parseJcal function', function() {
    it('should ignore message and log if message.ical is empty', function(done) {
      delete jsonMessage.ical;

      this.requireModule()
        .init()
        .then(function() {
          notifyFunction(jsonMessage);

          expect(loggerMock.warn).to.have.been.calledWith('CAlEventMailListener : Empty message ical => Event ignored');
          expect(caldavClientMock.putEvent).to.not.have.been.called;

          done();
        }).catch(function(err) {

        done(err || 'Err');
      });
    });

    it('should ignore message and log if message.ical format is not correct', function(done) {
      jsonMessage.ical = 'Test';

      this.requireModule()
        .init()
        .then(function() {
          notifyFunction(jsonMessage);

          expect(loggerMock.warn).to.have.been.calledWith('CAlEventMailListener : Error when parsing ical => Event ignored');
          expect(caldavClientMock.putEvent).to.not.have.been.called;

          done();
        }).catch(function(err) {

        done(err || 'Err');
      });
    });
  });

  describe('_handleRequest function', function() {
    it('should send request if message is valid', function(done) {
      this.requireModule()
        .init()
        .then(function() {
          notifyFunction(jsonMessage);

          expect(caldavClientMock.putEvent).to.have.been.calledWith('userId', 'events', jsonMessage.uid, ICAL.parse(jsonMessage.ical));

          done();
        }).catch(function(err) {

        done(err || 'Err');
      });
    });
  });
});
