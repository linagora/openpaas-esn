'use strict';

const expect = require('chai').expect;
const mockery = require('mockery');
const sinon = require('sinon');
const path = require('path');

describe('The email module', function() {
  let emailModule, from, to, user, mailConfigMock, esnConfigMock, message;

  beforeEach(function() {
    user = {_id: 1};
    from = 'from@baz.org';
    to = 'to@baz.org';
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

    esnConfigMock = {
      get: sinon.stub().returns(Promise.resolve(mailConfigMock))
    };

    message = {
      from,
      to: 'to@email',
      text: 'Hello'
    };

    esnConfigMock.forUser = sinon.stub().returns(esnConfigMock);
    mockery.registerMock('../esn-config', function() { return esnConfigMock; });
  });

  describe('The getMailer function', function() {
    it('should fail when getting mail user configuration fails', function(done) {
      const error = new Error('I failed!');

      esnConfigMock.get = sinon.spy(function() {
        return Promise.reject(error);
      });

      emailModule = this.helpers.requireBackend('core/email');
      emailModule.getMailer().send(message).then(done).catch(function(err) {
        expect(err).to.equals(error);
        expect(esnConfigMock.get).to.have.been.called;
        done();
      });
    });

    it('should fail when getting mail user configuration returns undefined', function(done) {
      esnConfigMock.get = sinon.spy(function() {
        return Promise.resolve();
      });

      emailModule = this.helpers.requireBackend('core/email');
      emailModule.getMailer().send(message).then(done).catch(function(err) {
        expect(err.message).to.match(/mail is not configured/);
        expect(esnConfigMock.get).to.have.been.called;
        done();
      });
    });

    it('should fail when mailsender call fails', function(done) {
      const error = new Error('I failed to send the message');
      const sendSpy = sinon.spy(function(message, callback) {
        callback(error);
      });

      mockery.registerMock('./mail-sender', function() {
        return {
          send: sendSpy
        };
      });

      emailModule = this.helpers.requireBackend('core/email');
      emailModule.getMailer().send(message).then(done).catch(function(err) {
        expect(err).to.equal(error);
        expect(sendSpy).to.have.been.calledWith(message);
        done();
      });
    });

    it('should resolve with mailsender call result', function(done) {
      const result = 'The mail send result';
      const sendSpy = sinon.spy(function(message, callback) {
        callback(null, result);
      });

      mockery.registerMock('./mail-sender', function() {
        return {
          send: sendSpy
        };
      });

      emailModule = this.helpers.requireBackend('core/email');
      emailModule.getMailer().send(message).then(function(_result) {
        expect(_result).to.equal(result);
        expect(sendSpy).to.have.been.calledWith(message);
        done();
      }).catch(done);
    });

    describe('The sendWithCustomTemplateFunction function', function() {
      it('should send the mail with the custom template function after getting the mail sender', function(done) {
        const result = 'The mail send result';
        const user = { _id: 'fake' };
        const sendWithCustomTemplateFunctionStub = sinon.stub().returns(Promise.resolve(result));

        mockery.registerMock('./mail-sender', function() {
          return {
            sendWithCustomTemplateFunction: sendWithCustomTemplateFunctionStub
          };
        });

        const options = { message, templateFn: () => {} };

        emailModule = this.helpers.requireBackend('core/email');
        emailModule.getMailer(user).sendWithCustomTemplateFunction(options)
          .then(_result => {
            expect(_result).to.equal(result);
            expect(sendWithCustomTemplateFunctionStub).to.have.been.calledWith(options);
            done();
          })
          .catch(err => done(err || new Error('should resolve')));

        expect(esnConfigMock.forUser).to.have.been.calledWith(user);
        expect(esnConfigMock.get).to.have.been.calledOnce;
      });

      it('should reject when something went wrong while sending the mail', function(done) {
        const user = { _id: 'fake' };
        const error = new Error('Something went wrong');
        const sendWithCustomTemplateFunctionStub = sinon.stub().returns(Promise.reject(error));

        mockery.registerMock('./mail-sender', function() {
          return {
            sendWithCustomTemplateFunction: sendWithCustomTemplateFunctionStub
          };
        });

        const options = { message, templateFn: () => {} };

        emailModule = this.helpers.requireBackend('core/email');
        emailModule.getMailer(user).sendWithCustomTemplateFunction(options)
          .then(() => done('should not resolve'))
          .catch(err => {
            expect(err).to.exist;
            expect(err.message).to.equal(error.message);
            done();
          });

        expect(esnConfigMock.forUser).to.have.been.calledWith(user);
        expect(esnConfigMock.get).to.have.been.calledOnce;
      });
    });
  });

  describe('Integration tests', function() {
    it('should fail if template does not exists', function(done) {
      const template = {name: 'I do not exist', path: path.resolve(__dirname + '/fixtures/templates')};
      const message = {
        to: to,
        from: from
      };
      const locals = {};
      const sendMailSpy = sinon.spy();
      const createTransportSpy = sinon.spy(function() {
        return {
          sendMail: sendMailSpy
        };
      });

      mockery.registerMock('nodemailer', {
        createTransport: createTransportSpy
      });

      emailModule = this.helpers.requireBackend('core/email');
      emailModule.getMailer(user).sendHTML(message, template, locals).then(function() {
        done(new Error('Should not happen'));
      }).catch(err => {
        expect(err.message).to.match(/Template generation failed/);
        expect(err.message).to.match(/ENOENT: no such file or directory/);
        expect(sendMailSpy).to.not.have.been.called;
        done();
      });
    });

    it('should reject when nodemailer transport fails', function(done) {
      const error = new Error('I failed to send message');
      const template = {name: 'simple', path: path.resolve(__dirname + '/fixtures/templates')};
      const message = {
        to: to,
        from: from
      };
      const locals = {};
      const sendMailSpy = sinon.spy(function(message, callback) {
        callback(error);
      });
      const createTransportSpy = sinon.spy(function() {
        return {
          sendMail: sendMailSpy
        };
      });

      mockery.registerMock('nodemailer', {
        createTransport: createTransportSpy
      });

      emailModule = this.helpers.requireBackend('core/email');
      emailModule.getMailer(user).sendHTML(message, template, locals).then(function() {
        done(new Error('Should not happen'));
      }).catch(err => {
        expect(err.message).to.equal(error.message);
        expect(sendMailSpy).to.have.been.called;
        done();
      });
    });

    describe('When template path is not defined', function() {
      let template;

      beforeEach(function() {
        this.checkCoreTemplate = function(done) {
          const sendMailResult = 'I sent the email';
          const message = {
            to: to,
            from: from
          };
          const locals = {
            user: {
              firstname: 'John',
              lastname: 'Doe'
            },
            domain: {
              name: 'The domain'
            },
            url: 'http://foo.bar'
          };
          const sendMailSpy = sinon.spy(function(message, callback) {
            callback(null, sendMailResult);
          });
          const createTransportSpy = sinon.spy(function() {
            return {
              sendMail: sendMailSpy
            };
          });

          mockery.registerMock('nodemailer', {
            createTransport: createTransportSpy
          });

          emailModule = this.helpers.requireBackend('core/email');
          emailModule.getMailer(user).sendHTML(message, template, locals).then(function(result) {
            expect(sendMailSpy).to.have.been.calledOnce;
            expect(sendMailSpy.firstCall.args[0].html).to.match(/John Doe invited you to join OpenPaas/);
            expect(result).to.equal(sendMailResult);
            done();
          }).catch(done);
        };
      });

      it('should use core templates when template.path is not defined', function(done) {
        template = {name: 'core.add-member'};
        this.checkCoreTemplate(done);
      });

      it('should use core template when template is a string', function(done) {
        template = 'core.add-member';
        this.checkCoreTemplate(done);
      });
    });

    describe('Template generation', function() {
      let sendMailSpy, createTransportSpy, sendMailResult, locals, message, template;

      beforeEach(function() {
        template = {path: path.resolve(__dirname + '/fixtures/templates')};
        message = {
          to: to,
          from: from
        };
        locals = { name: 'John Doe' };
        sendMailResult = 'The mail has been sent';
        sendMailSpy = sinon.spy(function(message, callback) {
          callback(null, sendMailResult);
        });
        createTransportSpy = sinon.spy(function() {
          return {
            sendMail: sendMailSpy
          };
        });

        mockery.registerMock('nodemailer', {
          createTransport: createTransportSpy
        });

        this.testGeneratedHTML = function(text, done) {
          emailModule = this.helpers.requireBackend('core/email');
          emailModule.getMailer(user).sendHTML(message, template, locals).then(function(result) {
            expect(result).to.equal(sendMailResult);
            expect(sendMailSpy).to.have.been.calledOnce;
            expect(sendMailSpy.firstCall.args[0]).to.shallowDeepEqual({
              to: message.to,
              from: message.from
            });
            expect(sendMailSpy.firstCall.args[0].html).to.match(new RegExp(text, 'g'));
            done();
          }).catch(done);
        };

        this.testWithAttachments = function(text, done) {
          emailModule = this.helpers.requireBackend('core/email');
          emailModule.getMailer(user).sendHTML(message, template, locals).then(function(result) {
            expect(result).to.equal(sendMailResult);
            expect(sendMailSpy).to.have.been.calledOnce;
            expect(sendMailSpy.firstCall.args[0]).to.shallowDeepEqual({
              to: message.to,
              from: message.from
            });
            expect(sendMailSpy.firstCall.args[0].html).to.match(new RegExp(text, 'g'));
            expect(sendMailSpy.firstCall.args[0].attachments).to.shallowDeepEqual({
              length: 2,
              0: {
                filename: 'README.md',
                cid: 'README',
                contentDisposition: 'inline'
              },
              1: {
                filename: 'logo.png',
                cid: 'logo',
                contentDisposition: 'inline'
              }
            });
            expect(sendMailSpy.firstCall.args[0].attachments[0].path).to.match(/attachments\/README.md/);
            expect(sendMailSpy.firstCall.args[0].attachments[1].path).to.match(/attachments\/logo.png/);
            done();
          }).catch(done);
        };
      });

      describe('EJS templates', function() {
        it('should call nodemailer with generated message', function(done) {
          template.name = 'ejs_template';
          this.testGeneratedHTML('<div>Hello from EJS John Doe</div>', done);
        });

        it('should call nodemailer with generated message and attachments', function(done) {
          template.name = 'ejs_with_attachments';
          this.testWithAttachments('<div>Hello from EJS with attachments John Doe</div>', done);
        });
      });

      describe('PUG templates', function() {
        it('should call nodemailer with generated message', function(done) {
          template.name = 'pug_template';
          this.testGeneratedHTML('<div>Hello from PUG John Doe</div>', done);
        });

        it('should call nodemailer with generated message and attachments', function(done) {
          template.name = 'pug_with_attachments';
          this.testWithAttachments('<div>Hello from PUG with attachments John Doe</div>', done);
        });
      });
    });
  });
});
