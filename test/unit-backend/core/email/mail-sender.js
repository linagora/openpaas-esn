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

  it('should throw expection when mailConfig is not defined', function() {
    mailSender = this.helpers.requireBackend('core/email/mail-sender');

    expect(mailSender).to.throw('mailConfig cannot be null');
  });

  describe('The sendHTML function', function() {
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
        return {
          buildWithEmailTemplates: function() { return Promise.resolve(); }
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

    it('should fail if message builder fails to build the message with email-templates', function(done) {
      const error = new Error('I failed to build message');
      const buildWithEmailTemplatesSpy = sinon.spy(function() {
        return Promise.reject(error);
      });

      getMailTransportSpy = sinon.spy(function() {
        return Promise.resolve(transport);
      });

      mockery.registerMock('./mail-transport', {
        get: getMailTransportSpy
      });

      mockery.registerMock('./message-builder', function() {
        return {
          buildWithEmailTemplates: buildWithEmailTemplatesSpy
        };
      });

      mailSender = this.helpers.requireBackend('core/email/mail-sender');
      mailSender(mailConfig).sendHTML(message, template, locals, function(err) {
        expect(err).to.equal(error);
        expect(getMailTransportSpy).to.have.been.called;
        expect(buildWithEmailTemplatesSpy).to.have.been.calledWith(message, template, locals);
        done();
      });
    });

    it('should fail if the mail transport fails to send the message', function(done) {
      const error = new Error('I failed to send message');
      const buildWithEmailTemplatesSpy = sinon.spy(function() {
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
        return {
          buildWithEmailTemplates: buildWithEmailTemplatesSpy
        };
      });

      mailSender = this.helpers.requireBackend('core/email/mail-sender');
      mailSender(mailConfig).sendHTML(message, template, locals, function(err) {
        expect(err).to.equal(error);
        expect(getMailTransportSpy).to.have.been.called;
        expect(transport.sendMail).to.have.been.calledWith(htmlMessage);
        expect(buildWithEmailTemplatesSpy).to.have.been.calledWith(message, template, locals);
        done();
      });
    });

    it('should send back transport send result', function(done) {
      const buildWithEmailTemplatesSpy = sinon.spy(function() {
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
        return {
          buildWithEmailTemplates: buildWithEmailTemplatesSpy
        };
      });

      mailSender = this.helpers.requireBackend('core/email/mail-sender');
      mailSender(mailConfig).sendHTML(message, template, locals, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.equal(transportResult);
        expect(getMailTransportSpy).to.have.been.called;
        expect(transport.sendMail).to.have.been.calledWith(htmlMessage);
        expect(buildWithEmailTemplatesSpy).to.have.been.calledWith(message, template, locals);
        done();
      });
    });
  });

  describe('The sendWithCustomTemplateFunction function', function() {
    let templateFn;

    beforeEach(function() {
      templateFn = () => {};
    });

    it('should reject when message is not defined', function(done) {
      mailSender = this.helpers.requireBackend('core/email/mail-sender');

      mailSender(mailConfig).sendWithCustomTemplateFunction({ template, templateFn, locals })
        .then(() => done('should not resolve'))
        .catch(err => {
          expect(err.message).to.equal('Invalid email message');
          done();
        });
    });

    it('should reject if message.to is not defined', function(done) {
      mailSender = this.helpers.requireBackend('core/email/mail-sender');

      mailSender(mailConfig).sendWithCustomTemplateFunction({ message: { from: 'whoever@nowhere.com' }, template, templateFn, locals })
        .then(() => done('should not resolve'))
        .catch(err => {
          expect(err.message).to.equal('Invalid email message');
          done();
        });
    });

    it('should reject if the mail transport cannot be found', function(done) {
      mockery.registerMock('./message-builder', () => () => Promise.resolve());

      const getMailTransportStub = sinon.stub().returns(Promise.resolve());

      mockery.registerMock('./mail-transport', {
        get: getMailTransportStub
      });

      mailSender = this.helpers.requireBackend('core/email/mail-sender');

      mailSender(mailConfig).sendWithCustomTemplateFunction({ message, template, templateFn, locals })
        .then(() => done('should not resolve'))
        .catch(err => {
          expect(err).to.exist;
          expect(err.message).to.equal('Transport can not be found');
          expect(getMailTransportStub).to.have.been.calledWith(mailConfig);
          done();
        });
    });

    it('should reject if it fails to get the mail transport', function(done) {
      const error = new Error('I failed to get transport');

      const getMailTransportStub = sinon.stub().returns(Promise.reject(error));

      mockery.registerMock('./mail-transport', {
        get: getMailTransportStub
      });

      mailSender = this.helpers.requireBackend('core/email/mail-sender');

      mailSender(mailConfig).sendWithCustomTemplateFunction({ message, template, templateFn, locals })
        .then(() => done('should not resolve'))
        .catch(err => {
          expect(err).to.equal(error);
          expect(getMailTransportStub).to.have.been.calledWith(mailConfig);
          done();
        });
    });

    it('should reject if the message builder fails to build the message', function(done) {
      const error = new Error('I failed to build the message');
      const buildWithCustomTemplateFunctionStub = sinon.stub().throws(error);

      const getMailTransportStub = sinon.stub().returns(Promise.resolve(transport));

      mockery.registerMock('./mail-transport', {
        get: getMailTransportStub
      });

      mockery.registerMock('./message-builder', () => ({
        buildWithCustomTemplateFunction: buildWithCustomTemplateFunctionStub
      }));

      const options = { message, template, templateFn, locals };

      mailSender = this.helpers.requireBackend('core/email/mail-sender');

      mailSender(mailConfig).sendWithCustomTemplateFunction(options)
        .then(() => done('should not resolve'))
        .catch(err => {
          expect(err).to.equal(error);
          expect(getMailTransportStub).to.have.been.called;
          expect(buildWithCustomTemplateFunctionStub).to.have.been.calledWith(options);
          done();
        });
    });

    it('should reject if the mail transport fails to send the message', function(done) {
      const error = new Error('I failed to send the message');
      const buildWithCustomTemplateFunctionStub = sinon.stub().returns(htmlMessage);

      transport.sendMail = sinon.stub().throws(error);

      const getMailTransportStub = sinon.stub().returns(Promise.resolve(transport));

      mockery.registerMock('./mail-transport', {
        get: getMailTransportStub
      });

      mockery.registerMock('./message-builder', () => ({
        buildWithCustomTemplateFunction: buildWithCustomTemplateFunctionStub
      }));

      const options = { message, template, templateFn, locals };

      mailSender = this.helpers.requireBackend('core/email/mail-sender');

      mailSender(mailConfig).sendWithCustomTemplateFunction(options)
      .then(() => done('should not resolve'))
      .catch(err => {
        expect(err).to.equal(error);
        expect(getMailTransportStub).to.have.been.called;
        expect(transport.sendMail).to.have.been.calledWith(htmlMessage);
        expect(buildWithCustomTemplateFunctionStub).to.have.been.calledWith(options);
        done();
      });
    });

    it('should send back transport send result', function(done) {
      const buildWithCustomTemplateFunctionStub = sinon.stub().returns(htmlMessage);

      transport.sendMail = sinon.spy(function(message, callback) {
        callback(null, transportResult);
      });

      const getMailTransportStub = sinon.stub().returns(Promise.resolve(transport));

      mockery.registerMock('./mail-transport', {
        get: getMailTransportStub
      });

      mockery.registerMock('./message-builder', function() {
        return {
          buildWithCustomTemplateFunction: buildWithCustomTemplateFunctionStub
        };
      });

      const options = { message, template, templateFn, locals };

      mailSender = this.helpers.requireBackend('core/email/mail-sender');

      mailSender(mailConfig).sendWithCustomTemplateFunction(options)
        .then(result => {
          expect(result).to.equal(transportResult);
          expect(getMailTransportStub).to.have.been.called;
          expect(transport.sendMail).to.have.been.calledWith(htmlMessage);
          expect(buildWithCustomTemplateFunctionStub).to.have.been.calledWith(options);
          done();
        })
        .catch(err => done(err || new Error('should resolve')));
    });
  });
});
