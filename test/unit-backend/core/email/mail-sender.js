'use strict';

const expect = require('chai').expect;
const mockery = require('mockery');
const sinon = require('sinon');

describe('The mail-sender module', function() {
  let mailSender, from, to, mailConfigMock, esnConfigMock, mailConfig, template, locals, getMailTransportSpy, sendMailSpy, transport, message, htmlMessage, transportResult;

  beforeEach(function() {
    to = 'to@baz.org';
    from = 'from@baz.org';
    mailConfigMock = {
      mail: {
        noreply: 'no-reply@open-paas.org'
      },
      transport: {
        module: 'nodemailer-browser',
        config: {
          dir: '/tmp',
          browser: true
        }
      }
    };
    template = { name: 'core.password', path: '/foo/bar/baz' };
    locals = { firstname: 'John', lastname: 'Doe' };
    mailConfig = { mail: {noreply: 'donotreply@mail.com'} };
    message = { to, from };
    htmlMessage = 'The generated HTML message';
    transportResult = 'The transport result';

    esnConfigMock = {
      get: function() {
        return Promise.resolve(mailConfigMock);
      }
    };
    esnConfigMock.forUser = sinon.stub().returns(esnConfigMock);

    sendMailSpy = sinon.spy();
    transport = {
      sendMail: sendMailSpy
    };

    getMailTransportSpy = sinon.spy(function() {
      return Promise.resolve(transport);
    });

    mockery.registerMock('../esn-config', function() { return esnConfigMock; });
  });

  describe('The sendHTML function', function() {
    it('should throw expection when mailConfig is not defined', function() {
      mailSender = this.helpers.requireBackend('core/email/mail-sender');

      expect(mailSender).to.throw('mailConfig cannot be null');
    });

    it('should fail when message is not defined', function(done) {
      mailSender = this.helpers.requireBackend('core/email/mail-sender');

      mailSender(mailConfig).sendHTML(null, template, locals, function(err) {
        expect(err.message).to.match(/message must be an object/);
        done();
      });
    });

    it('should fail if message.to is not defined', function(done) {
      mailSender = this.helpers.requireBackend('core/email/mail-sender');

      mailSender(mailConfig).sendHTML({}, template, locals, function(err) {
        expect(err.message).to.match(/message.to can not be null/);
        done();
      });
    });

    it('should fail if mail transport can not be found', function(done) {
      mockery.registerMock('./message-builder', function() {
        return function() {
          return Promise.resolve();
        };
      });

      getMailTransportSpy = sinon.spy(function() {
        return Promise.resolve();
      });

      mockery.registerMock('./mail-transport', {
        get: getMailTransportSpy
      });

      mailSender = this.helpers.requireBackend('core/email/mail-sender');

      mailSender(mailConfig).sendHTML(message, template, locals, function(err) {
        expect(err.message).to.match(/Transport can not be found/);
        expect(getMailTransportSpy).to.have.been.calledWith(mailConfig);
        done();
      });
    });

    it('should fail if mail transport retrieval rejects', function(done) {
      const error = new Error('I failed to get transport');

      getMailTransportSpy = sinon.spy(function() {
        return Promise.reject(error);
      });

      mockery.registerMock('./mail-transport', {
        get: getMailTransportSpy
      });

      mailSender = this.helpers.requireBackend('core/email/mail-sender');
      mailSender(mailConfig).sendHTML(message, template, locals, function(err) {
        expect(err).to.equal(error);
        expect(getMailTransportSpy).to.have.been.calledWith(mailConfig);
        done();
      });
    });

    it('should fail if message builder fails', function(done) {
      const error = new Error('I failed to build message');
      const messageBuilderSpy = sinon.spy(function() {
        return Promise.reject(error);
      });

      getMailTransportSpy = sinon.spy(function() {
        return Promise.resolve(transport);
      });

      mockery.registerMock('./mail-transport', {
        get: getMailTransportSpy
      });

      mockery.registerMock('./message-builder', function() {
        return messageBuilderSpy;
      });

      mailSender = this.helpers.requireBackend('core/email/mail-sender');
      mailSender(mailConfig).sendHTML(message, template, locals, function(err) {
        expect(err).to.equal(error);
        expect(getMailTransportSpy).to.have.been.called;
        expect(messageBuilderSpy).to.have.been.calledWith(message, template, locals);
        done();
      });
    });

    it('should fail if mail transport send fails', function(done) {
      const error = new Error('I failed to send message');
      const messageBuilderSpy = sinon.spy(function() {
        return Promise.resolve(htmlMessage);
      });

      transport.sendMail = sinon.spy(function(message, callback) {
        callback(error);
      });

      getMailTransportSpy = sinon.spy(function() {
        return Promise.resolve(transport);
      });

      mockery.registerMock('./mail-transport', {
        get: getMailTransportSpy
      });

      mockery.registerMock('./message-builder', function() {
        return messageBuilderSpy;
      });

      mailSender = this.helpers.requireBackend('core/email/mail-sender');
      mailSender(mailConfig).sendHTML(message, template, locals, function(err) {
        expect(err).to.equal(error);
        expect(getMailTransportSpy).to.have.been.called;
        expect(transport.sendMail).to.have.been.calledWith(htmlMessage);
        expect(messageBuilderSpy).to.have.been.calledWith(message, template, locals);
        done();
      });
    });

    it('should send back transport send result', function(done) {
      const messageBuilderSpy = sinon.spy(function() {
        return Promise.resolve(htmlMessage);
      });

      transport.sendMail = sinon.spy(function(message, callback) {
        callback(null, transportResult);
      });

      getMailTransportSpy = sinon.spy(function() {
        return Promise.resolve(transport);
      });

      mockery.registerMock('./mail-transport', {
        get: getMailTransportSpy
      });

      mockery.registerMock('./message-builder', function() {
        return messageBuilderSpy;
      });

      mailSender = this.helpers.requireBackend('core/email/mail-sender');
      mailSender(mailConfig).sendHTML(message, template, locals, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.equal(transportResult);
        expect(getMailTransportSpy).to.have.been.called;
        expect(transport.sendMail).to.have.been.calledWith(htmlMessage);
        expect(messageBuilderSpy).to.have.been.calledWith(message, template, locals);
        done();
      });
    });
  });
});
