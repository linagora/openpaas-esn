'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
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
      iTipRequest: sinon.spy(function() {
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
          expect(caldavClientMock.iTipRequest).to.not.have.been.called;

          done();
        })
        .catch(function(err) {
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
          expect(caldavClientMock.iTipRequest).to.not.have.been.called;

          done();
        })
        .catch(function(err) {
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
          expect(caldavClientMock.iTipRequest).to.not.have.been.called;

          done();
        })
        .catch(function(err) {
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
          expect(caldavClientMock.iTipRequest).to.not.have.been.called;

          done();
        })
        .catch(function(err) {
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
          expect(caldavClientMock.iTipRequest).to.not.have.been.called;

          done();
        })
        .catch(function(err) {
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
          expect(caldavClientMock.iTipRequest).to.not.have.been.called;

          done();
        })
        .catch(function(err) {
          done(err || 'Err');
        });
    });
  });

  describe('_handleMessage function', function() {
    it('should send request if message is valid', function(done) {
      this.requireModule()
        .init()
        .then(function() {
          notifyFunction(jsonMessage);

          expect(caldavClientMock.iTipRequest).to.have.been.calledWith('userId', jsonMessage);

          done();
        })
        .catch(function(err) {
          done(err || 'Err');
        });
    });
  });
});
