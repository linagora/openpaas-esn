'use strict';

var expect = require('chai').expect;
var path = require('path');
var fs = require('fs');
var from = 'from@baz.org';

describe('The email module', function() {

  before(function() {
    this.testEnv.writeDBConfigFile();
  });

  after(function() {
    this.testEnv.removeDBConfigFile();
  });

  it('should throw error if recipient is not defined', function(done) {
    var email = require('../../../../backend/core/email');
    email.transport = function() {};
    email.send(null, null, 'The subject', 'Hello', function(err) {
      expect(err).to.exist;
      done();
    });
  });

  it('should call the transport layer when all data is valid', function(done) {
    var email = require('../../../../backend/core/email');
    var called = false;
    email.setTransport({
      sendMail: function(message, cb) {
        called = true;
        return cb();
      }
    });
    email.send(from, 'foo@bar.com', 'The subject', 'Hello', function(err) {
      expect(err).to.not.exist;
      expect(called).to.be.true;
      done();
    });
  });

  it('should send email with sendmail mock (pickup)', function(done) {
    var tmp = this.testEnv.tmp;
    var email = require('../../../../backend/core/email');
    var nodemailer = require('nodemailer');
    var transport = nodemailer.createTransport('Pickup', {directory: this.testEnv.tmp});
    email.setTransport(transport);

    var message = 'Hello from node';
    email.send(from, 'foo@bar.com', 'The subject', message, function(err, response) {
      expect(err).to.not.exist;
      var file = path.resolve(tmp + '/' + response.messageId + '.eml');
      expect(fs.existsSync(file)).to.be.true;

      var MailParser = require('mailparser').MailParser;
      var mailparser = new MailParser();
      mailparser.on('end', function(mail_object) {
        expect(mail_object.text).to.have.string(message);
        done();
      });
      fs.createReadStream(file).pipe(mailparser);
    });
  });

  it('should send email with from as name <address>', function(done) {
    var tmp = this.testEnv.tmp;
    var email = require('../../../../backend/core/email');
    var nodemailer = require('nodemailer');
    var transport = nodemailer.createTransport('Pickup', {directory: this.testEnv.tmp});
    email.setTransport(transport);
    var name = 'Foo Bar';
    var address = 'foo@baz.org';
    var source = name + '<' + address + '>';

    var message = 'Hello from node';
    email.send(source, 'foo@bar.com', 'The subject', message, function(err, response) {
      expect(err).to.not.exist;
      var file = path.resolve(tmp + '/' + response.messageId + '.eml');
      expect(fs.existsSync(file)).to.be.true;

      var MailParser = require('mailparser').MailParser;
      var mailparser = new MailParser();
      mailparser.on('end', function(mail_object) {
        expect(mail_object.text).to.have.string(message);
        expect(mail_object.from[0].name).to.equal(name);
        expect(mail_object.from[0].address).to.equal(address);
        done();
      });
      fs.createReadStream(file).pipe(mailparser);
    });
  });

  it('should send email with to as name <address>', function(done) {
    var tmp = this.testEnv.tmp;
    var email = require('../../../../backend/core/email');
    var nodemailer = require('nodemailer');
    var transport = nodemailer.createTransport('Pickup', {directory: this.testEnv.tmp});
    email.setTransport(transport);
    var name = 'Foo Bar';
    var address = 'foo@baz.org';
    var to = name + '<' + address + '>';

    var message = 'Hello from node';
    email.send(from, to, 'The subject', message, function(err, response) {
      expect(err).to.not.exist;
      var file = path.resolve(tmp + '/' + response.messageId + '.eml');
      expect(fs.existsSync(file)).to.be.true;

      var MailParser = require('mailparser').MailParser;
      var mailparser = new MailParser();
      mailparser.on('end', function(mail_object) {
        expect(mail_object.text).to.have.string(message);
        expect(mail_object.to[0].name).to.equal(name);
        expect(mail_object.to[0].address).to.equal(address);
        done();
      });
      fs.createReadStream(file).pipe(mailparser);
    });
  });

  it('should fail when template does not exist', function(done) {
    var email = require('../../../../backend/core/email');
    var nodemailer = require('nodemailer');
    var transport = nodemailer.createTransport('Pickup', {directory: this.testEnv.tmp});
    var templates = path.resolve(__dirname + '/fixtures/templates/');

    email.setTransport(transport);
    email.setTemplatesDir(templates);

    var type = 'foobar';
    email.sendHTML(from, 'foo@bar.com', 'The subject', type, {}, function(err, message) {
      expect(err).to.exist;
      done();
    });
  });

  it('should generate and send HTML email from existing template', function(done) {
    var tmp = this.testEnv.tmp;
    var email = require('../../../../backend/core/email');
    var nodemailer = require('nodemailer');
    var transport = nodemailer.createTransport('Pickup', {directory: this.testEnv.tmp});
    var templates = path.resolve(__dirname + '/fixtures/templates/');

    email.setTransport(transport);
    email.setTemplatesDir(templates);

    var type = 'confirm_url';
    var locals = {
      link: 'http://localhost:8080/confirm/123456789',
      name: {
        first: 'foo',
        last: 'bar'
      }
    };

    email.sendHTML(from, 'foo@bar.com', 'The subject', type, locals, function(err, message) {
      expect(err).to.not.exist;
      var file = path.resolve(tmp + '/' + message.messageId + '.eml');
      var fs = require('fs');
      expect(fs.existsSync(file)).to.be.true;
      var MailParser = require('mailparser').MailParser;
      var mailparser = new MailParser();
      mailparser.on('end', function(mail_object) {
        expect(mail_object.html).to.have.string(locals.link);
        expect(mail_object.html).to.have.string(locals.name.first);
        expect(mail_object.html).to.have.string(locals.name.last);
        done();
      });
      fs.createReadStream(file).pipe(mailparser);
    });
  });

  describe('with configured ESN', function() {
    before(function(done) {
      var conf = require('../../../../backend/core/esn-config')('mail');
      var mail = {
        transport: {
          type: 'Pickup',
          config: {
            directory: this.testEnv.tmp
          }
        }
      };

      conf.store(mail, function(err) {
        done(err);
      });
    });

    after(function(done) {
      var conf = require('../../../../backend/core/esn-config')('mail');
      conf.store({}, function(err) {
        done(err);
      });
    });

    it('should send an email with configured ESN', function(done) {
      var tmp = this.testEnv.tmp;
      var email = require('../../../../backend/core/email');
      var templates = path.resolve(__dirname + '/fixtures/templates/');
      email.setTemplatesDir(templates);

      var type = 'confirm_url';
      var locals = {
        link: 'http://localhost:8080/confirm/123456789',
        name: {
          first: 'foo',
          last: 'bar'
        }
      };

      email.sendHTML(from, 'foo@bar.com', 'The subject', type, locals, function(err, message) {
        expect(err).to.not.exist;
        var file = path.resolve(tmp + '/' + message.messageId + '.eml');
        var fs = require('fs');
        expect(fs.existsSync(file)).to.be.true;
        var MailParser = require('mailparser').MailParser;
        var mailparser = new MailParser();
        mailparser.on('end', function(mail_object) {
          expect(mail_object.html).to.have.string(locals.link);
          expect(mail_object.html).to.have.string(locals.name.first);
          expect(mail_object.html).to.have.string(locals.name.last);
          done();
        });
        fs.createReadStream(file).pipe(mailparser);
      });

    });
  });

  describe('With unconfigured ESN', function() {
    beforeEach(function(done) {
      var conf = require('../../../../backend/core/esn-config')('mail');
      conf.store({}, function(err) {
        done(err);
      });
    });

    it('should fail when transport is not defined', function(done) {
      var email = require('../../../../backend/core/email');
      email.send(from, 'to@foo.com', 'None', 'Hello', function(err, message) {
        expect(err).to.exist;
        done();
      });
    });
  });

});
