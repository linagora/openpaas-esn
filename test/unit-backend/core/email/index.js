'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var sinon = require('sinon');
var q = require('q');
var from = 'from@baz.org';

describe('The email module', function() {

  var emailModule;
  var mailConfigMock, transportMock, templateMock, nodemailerMock, esnConfigMock, attachmentHelpersMock;

  beforeEach(function() {
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

    templateMock = function() {};

    esnConfigMock = {
      get: function() {
        return q(mailConfigMock);
      }
    };
    esnConfigMock.forUser = sinon.stub().returns(esnConfigMock);

    transportMock = {
      sendMail: function(msg, callback) { callback(); }
    };

    nodemailerMock = {
      createTransport: function() { return transportMock; }
    };

    attachmentHelpersMock = {
      hasAttachments: function() { return false; }
    };

    mockery.registerMock('nodemailer', nodemailerMock);
    mockery.registerMock('nodemailer-browser', function() {});
    mockery.registerMock('email-templates', function(templatesDir, callback) {
      callback(null, templateMock);
    });
    mockery.registerMock('../esn-config', function() { return esnConfigMock; });
    mockery.registerMock('./attachment-helpers', attachmentHelpersMock);

    emailModule = this.helpers.requireBackend('core/email');
  });

  it('should fail when transport is not defined', function(done) {
    var message = {
      from: from,
      to: 'to@email',
      text: 'Hello'
    };

    delete mailConfigMock.transport;

    emailModule.getMailer().send(message, function(err) {
      expect(err.message).to.equal('Mail transport is not configured');
      done();
    });
  });

  it('should fail when it fails to create transport', function(done) {
    var message = {
      from: from,
      to: 'to@email',
      text: 'Hello'
    };

    nodemailerMock.createTransport = function() {
      throw new Error('transport error');
    };

    emailModule.getMailer().send(message, function(err) {
      expect(err.message).to.equal('transport error');
      done();
    });
  });

  it('should use user parameter to get mail configuration', function(done) {
    var user = { _id: '123' };
    var message = {
      from: from,
      to: 'to@email',
      text: 'Hello'
    };

    emailModule.getMailer(user).send(message, function(err) {
      expect(err).to.not.exist;
      expect(esnConfigMock.forUser).to.have.been.calledWith(user);
      done();
    });
  });

  it('should resolve when it sends email successfully', function(done) {
    var message = {
      to: 'to@email',
      text: 'message content'
    };
    var response = 'some data';

    transportMock.sendMail = function(msg, callback) {
      callback(null, response);
    };

    emailModule.getMailer().send(message).then(function(data) {
      expect(data).to.deep.equal(response);
      done();
    });
  });

  it('should reject when it fails to send email', function(done) {
    var message = {
      to: 'to@email',
      text: 'message content'
    };
    var error = new Error('some error');

    transportMock.sendMail = function(msg, callback) {
      callback(error);
    };

    emailModule.getMailer().send(message).catch(function(err) {
      expect(err.message).to.equal(error.message);
      done();
    });
  });

  describe('The send fn', function() {

    it('should throw error if message is not defined', function(done) {
      emailModule.getMailer().send(null, function(err) {
        expect(err.message).to.equal('message must be an object');
        done();
      });
    });

    it('should throw error if recipient is not defined', function(done) {
      emailModule.getMailer().send({}, function(err) {
        expect(err.message).to.equal('message.to can not be null');
        done();
      });
    });

    it('should throw error if message content is not defined', function(done) {
      var message = { to: 'to@email' };

      emailModule.getMailer().send(message, function(err) {
        expect(err.message).to.equal('message content can not be null');
        done();
      });
    });

    it('should call the transport layer when all data is valid', function(done) {
      var message = {
        to: 'to@email',
        text: 'message content'
      };

      transportMock.sendMail = sinon.spy(function(msg, callback) {
        expect(msg).to.shallowDeepEqual(message);
        expect(msg.from).to.equal(mailConfigMock.mail.noreply);
        callback();
      });

      emailModule.getMailer().send(message, function(err) {
        expect(err).to.not.exist;
        expect(transportMock.sendMail).to.have.been.calledOnce;
        done();
      });
    });

  });

  describe('The sendHTML fn', function() {

    it('should throw error if message is not defined', function(done) {
      var templateName = 'template';
      var locals = {};

      emailModule.getMailer().sendHTML(null, templateName, locals, function(err) {
        expect(err.message).to.equal('message must be an object');
        done();
      });
    });

    it('should throw error if recipient is not defined', function(done) {
      var templateName = 'template';
      var locals = {};

      emailModule.getMailer().sendHTML({}, templateName, locals, function(err) {
        expect(err.message).to.equal('message.to can not be null');
        done();
      });
    });

    it('should fail when template does not exist', function(done) {
      templateMock = function(templateName, data, callback) {
        callback(new Error('template does not exist'));
      };

      var templateName = 'foobar';
      var locals = {};
      var message = {
        from: from,
        to: 'to@email',
        text: 'Message'
      };

      emailModule.getMailer().sendHTML(message, templateName, locals, function(err) {
        expect(err.message).to.equal('template does not exist');
        done();
      });
    });

    it('should generate and send HTML email from existing template', function(done) {
      var templateName = 'confirm_url';
      var locals = {
        name: {
          first: 'foo',
          last: 'bar'
        }
      };
      var message = {
        from: from,
        to: 'to@email',
        subject: 'The subject'
      };
      var htmlContent = '<h1>hello</h1>';
      var textContent = 'hello';

      templateMock = function(templateName, data, callback) {
        if (templateName === 'confirm_url') {
          expect(data).to.shallowDeepEqual(locals);

          return callback(null, htmlContent, textContent);
        }

        callback(new Error('template does not exist'));
      };
      transportMock.sendMail = sinon.spy(function(msg, callback) {
        expect(msg.html).to.shallowDeepEqual(htmlContent);
        expect(msg.text).to.shallowDeepEqual(textContent);
        callback();
      });

      emailModule.getMailer().sendHTML(message, templateName, locals, function(err) {
        expect(err).to.not.exist;
        expect(transportMock.sendMail).to.have.been.calledOnce;
        done();
      });
    });

    it('should include attachments in email if the template has attachments', function(done) {
      var templateName = 'confirm_url';
      var locals = {};
      var message = {
        from: from,
        to: 'to@email',
        subject: 'The subject'
      };
      var htmlContent = '<h1>hello</h1>';
      var textContent = 'hello';
      var attachments = [{
        filename: 'file1',
        path: '/path/to/file1',
        cid: '/pat/to/file1/cid',
        contentDisposition: 'inline'
      }, {
        filename: 'file2',
        path: '/path/to/file2',
        cid: '/pat/to/file2/cid',
        contentDisposition: 'inline'
      }];

      templateMock = function(templateName, data, callback) {
        return callback(null, htmlContent, textContent);
      };

      transportMock.sendMail = function(msg, callback) {
        callback();
      };

      attachmentHelpersMock.hasAttachments = function() { return true; };
      attachmentHelpersMock.getAttachments = function(templatesDir, template, filter, done) {
        return done(null, attachments);
      };

      emailModule.getMailer().sendHTML(message, templateName, locals, function(err) {
        expect(err).to.not.exist;
        expect(message.attachments).to.deep.equal(attachments);
        done();
      });
    });

    it('should append attachments to existing attachments of the email if the template has attachments', function(done) {
      var templateName = 'confirm_url';
      var locals = {};
      var htmlContent = '<h1>hello</h1>';
      var textContent = 'hello';
      var attachments = [{
        filename: 'file1',
        path: '/path/to/file1',
        cid: '/pat/to/file1/cid',
        contentDisposition: 'inline'
      }, {
        filename: 'file2',
        path: '/path/to/file2',
        cid: '/pat/to/file2/cid',
        contentDisposition: 'inline'
      }, {
        filename: 'file3',
        path: '/path/to/file3',
        cid: '/pat/to/file3/cid',
        contentDisposition: 'inline'
      }];
      var message = {
        from: from,
        to: 'to@email',
        subject: 'The subject',
        attachments: attachments.slice(0, 1)
      };

      templateMock = function(templateName, data, callback) {
        return callback(null, htmlContent, textContent);
      };

      transportMock.sendMail = function(msg, callback) {
        callback();
      };

      attachmentHelpersMock.hasAttachments = function() { return true; };
      attachmentHelpersMock.getAttachments = function(templatesDir, template, filter, done) {
        return done(null, attachments.slice(1));
      };

      emailModule.getMailer().sendHTML(message, templateName, locals, function(err) {
        expect(err).to.not.exist;
        expect(message.attachments).to.deep.equal(attachments);
        done();
      });
    });
  });

});
