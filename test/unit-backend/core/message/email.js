'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;
var EventEmitter = require('events').EventEmitter;

describe('The email message module', function() {

  describe('The saveEmail fn', function() {

    it('should send back error when email stream is undefined', function(done) {
      mockery.registerMock('mongoose', {
        model: function() {}
      });

      mockery.registerMock('mailparser', {
        MailParser: function() {}
      });

      var emailModule = require(this.testEnv.basePath + '/backend/core/message/email');
      emailModule.saveEmail(null, {}, [], function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error when email author is undefined', function(done) {
      mockery.registerMock('mongoose', {
        model: function() {}
      });

      mockery.registerMock('mailparser', {
        MailParser: function() {}
      });

      var emailModule = require(this.testEnv.basePath + '/backend/core/message/email');
      emailModule.saveEmail({}, null, [], function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should call email#save on end stream event', function(done) {
      mockery.registerMock('mongoose', {
        model: function() {
          return function() {
            return {
              save: function() {
                return done();
              }
            };
          };
        }
      });

      mockery.registerMock('mailparser', {
        MailParser: function() {
          return new EventEmitter();
        }
      });

      var stream = {
        pipe: function(parser) {
          parser.emit('end', {});
        }
      };

      var emailModule = require(this.testEnv.basePath + '/backend/core/message/email');
      emailModule.saveEmail(stream, {}, [], function(err) {
        expect(err).to.not.exist;
        done();
      });
    });

    it('should send back error when email can not be parsed', function(done) {
      mockery.registerMock('mongoose', {
        model: function() {
          return function() {
            return {
              save: function() {
                return done();
              }
            };
          };
        }
      });

      mockery.registerMock('mailparser', {
        MailParser: function() {
          return new EventEmitter();
        }
      });

      var stream = {
        pipe: function(parser) {
          parser.emit('end');
        }
      };

      var emailModule = require(this.testEnv.basePath + '/backend/core/message/email');
      emailModule.saveEmail(stream, {}, [], function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should fill the mail object with the parsed email', function(done) {

      var author = 123;
      var mail = {
        headers: {
          'Received': ['from locahost (localhost [127.0.0.1])', 'from linagora (linagora [10.75.9.2])'],
          'From': 'AwesomeGuy <awesomeguy@linagora.com',
          'To': 'anotherone@linagora.com',
          'Subject': 'a subject'
        },
        text: 'The text part of email body',
        html: 'The html part of email body',
        to: ['anotherone@linagora.com'],
        from: 'AwesomeGuy <awesomeguy@linagora.com',
        cc: ['AwesomeGuyCC <awesomeguycc@linagora.com'],
        bcc: ['AwesomeGuyBCC <awesomeguybcc@linagora.com'],
        subject: 'This is a test'
      };

      mockery.registerMock('mongoose', {
        model: function() {
          return function() {
            return {
              save: function() {
                expect(this.author).to.equal(author);
                expect(this.headers).to.deep.equal([
                  ['Received', 'from locahost (localhost [127.0.0.1])'],
                  ['Received', 'from linagora (linagora [10.75.9.2])'],
                  ['From', 'AwesomeGuy <awesomeguy@linagora.com'],
                  ['To', 'anotherone@linagora.com'],
                  ['Subject', 'a subject']
                ]);
                expect(this.body.text).to.equal(mail.text);
                expect(this.body.html).to.equal(mail.html);
                expect(this.parsedHeaders).to.exist;
                expect(this.parsedHeaders.to).to.deep.equal(mail.to);
                expect(this.parsedHeaders.from).to.equal(mail.from);
                expect(this.parsedHeaders.cc).to.deep.equal(mail.cc);
                expect(this.parsedHeaders.bcc).to.deep.equal(mail.bcc);
                expect(this.parsedHeaders.subject).to.deep.equal(mail.subject);
                return done();
              }
            };
          };
        }
      });

      mockery.registerMock('mailparser', {
        MailParser: function() {
          return new EventEmitter();
        }
      });

      var stream = {
        pipe: function(parser) {
          parser.emit('end', mail);
        }
      };

      var emailModule = require(this.testEnv.basePath + '/backend/core/message/email');
      emailModule.saveEmail(stream, author, [], function(err) {
        expect(err).to.not.exist;
        done();
      });
    });
  });
});
