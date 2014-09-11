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
        from: [{address: 'from@bar.com'}],
        to: [{address: 'to1@bar.com'}, {address: 'to2@bar.com'}],
        cc: [{address: 'cc1@bar.com'}, {address: 'cc2@bar.com'}, {address: 'cc3@bar.com'}],
        bcc: [{address: 'bcc1@bar.com'}, {address: 'bcc2@bar.com'}],
        subject: 'The email subject',
        text: 'The text part of email body',
        html: 'The html part of email body'
      };

      mockery.registerMock('mongoose', {
        model: function() {
          return function() {
            return {
              save: function() {
                expect(this.author).to.equal(author);
                expect(this.from).to.equal(mail.from[0].address);
                expect(this.to).to.exist;
                expect(this.to.length).to.equal(2);
                expect(this.cc).to.exist;
                expect(this.cc.length).to.equal(3);
                expect(this.bcc).to.exist;
                expect(this.bcc.length).to.equal(2);
                expect(this.subject).to.equal(mail.subject);
                expect(this.body.text).to.equal(mail.text);
                expect(this.body.html).to.equal(mail.html);
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
