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
        from: ['AwesomeGuy <awesomeguy@linagora.com'],
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
                expect(this.parsedHeaders.from).to.equal(mail.from[0]);
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
      });
    });


    it('should call attachmentModule#storeAttachment for each of the parsed attachments', function(done) {
      var author = 123;
      var mail = {
        headers: {
          'Received': ['from locahost (localhost [127.0.0.1])', 'from linagora (linagora [10.75.9.2])'],
          'From': 'AwesomeGuy <awesomeguy@linagora.com',
          'To': 'anotherone@linagora.com',
          'Subject': 'a subject'
        },
        text: 'The text part of email body',
        html: 'The html part of email body'
      };

      var attachment1 = {
        contentType: 'image/png',
        fileName: 'image1.png'
      };

      var attachment2 = {
        contentType: 'image/png',
        fileName: 'image2.png'
      };

      var calls = 0;
      mockery.registerMock('./attachments', {
        storeAttachment: function(metaData, attachmentStream, options, callback) {
          calls++;
          expect(metaData).to.exist;
          if (metaData.name === attachment1.fileName) {
            expect(metaData.contentType).to.equal(attachment1.contentType);
            callback(null, {});
          }
          else if (metaData.name === attachment2.fileName) {
            expect(metaData.contentType).to.equal(attachment2.contentType);
            callback(null, {});
          }
          else {
            done(new Error('Unexpected call'));
          }
        }
      });

      mockery.registerMock('mongoose', {
        model: function() {
          return function() {
            return {
              save: function(callback) {
                var saved = {
                  _id: {
                    toString: function() {}
                  }
                };
                return callback(null, saved);
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

      mockery.registerMock('q', {
        defer: function() {
          return {
            promise: {},
            resolve: function() {},
            reject: function() {
              return done(new Error('Unexpected error.'));
            }
          };
        },
        all: function() {
          return {
            then: function(callback) {
              callback([]);
            }
          };
        }
      });

      var stream = {
        pipe: function(parser) {
          parser.emit('attachment', attachment1);
          parser.emit('attachment', attachment2);
          parser.emit('end', mail);
        }
      };

      var emailModule = require(this.testEnv.basePath + '/backend/core/message/email');
      emailModule.saveEmail(stream, author, [], function(err) {
        expect(err).to.not.exist;
        expect(calls).to.equal(2);
        done();
      });
    });

    it('should set the author as attachment creator', function(done) {
      var author = {_id: 123};
      var mail = {
        headers: {
          'Received': ['from locahost (localhost [127.0.0.1])', 'from linagora (linagora [10.75.9.2])'],
          'From': 'AwesomeGuy <awesomeguy@linagora.com',
          'To': 'anotherone@linagora.com',
          'Subject': 'a subject'
        },
        text: 'The text part of email body',
        html: 'The html part of email body'
      };

      var attachment1 = {
        contentType: 'image/png',
        fileName: 'image1.png'
      };

      var attachment2 = {
        contentType: 'image/png',
        fileName: 'image2.png'
      };

      var calls = 0;
      mockery.registerMock('./attachments', {
        storeAttachment: function(metaData, attachmentStream, options, callback) {
          calls++;
          expect(metaData).to.exist;
          expect(metaData.creator).to.exist;
          expect(metaData.creator.objectType).to.equal('user');
          expect(metaData.creator.id).to.equal(author._id);

          if (metaData.name === attachment1.fileName) {
            expect(metaData.contentType).to.equal(attachment1.contentType);
            callback(null, {});
          }
          else if (metaData.name === attachment2.fileName) {
            expect(metaData.contentType).to.equal(attachment2.contentType);
            callback(null, {});
          }
          else {
            done(new Error('Unexpected call'));
          }
        }
      });

      mockery.registerMock('mongoose', {
        model: function() {
          return function() {
            return {
              save: function(callback) {
                var saved = {
                  _id: {
                    toString: function() {}
                  }
                };
                return callback(null, saved);
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

      mockery.registerMock('q', {
        defer: function() {
          return {
            promise: {},
            resolve: function() {},
            reject: function() {
              return done(new Error('Unexpected error.'));
            }
          };
        },
        all: function() {
          return {
            then: function(callback) {
              callback([]);
            }
          };
        }
      });

      var stream = {
        pipe: function(parser) {
          parser.emit('attachment', attachment1);
          parser.emit('attachment', attachment2);
          parser.emit('end', mail);
        }
      };

      var emailModule = require(this.testEnv.basePath + '/backend/core/message/email');
      emailModule.saveEmail(stream, author, [], function(err) {
        expect(err).to.not.exist;
        expect(calls).to.equal(2);
        done();
      });
    });


    it('should throw an error if attachmentModule#storeAttachment fails', function(done) {
      var author = 123;
      var attachment1 = {
        contentType: 'image/png',
        fileName: 'image1.png'
      };

      mockery.registerMock('./attachments', {
        storeAttachment: function(metaData, attachmentStream, options, callback) {
          callback(new Error('Attachment storage problem'));
        }
      });

      mockery.registerMock('mongoose', {
        model: function() {
          return function() {};
        }
      });

      mockery.registerMock('mailparser', {
        MailParser: function() {
          return new EventEmitter();
        }
      });

      var promiseError;
      mockery.registerMock('q', {
        defer: function() {
          return {
            promise: {},
            resolve: function() {
              return done(new Error('Unexpected call.'));
            },
            reject: function(err) {
              promiseError = err;
            }
          };
        },
        all: function() {
          return {
            then: function(callback, errorCallback) {
              errorCallback(promiseError);
            }
          };
        }
      });

      var stream = {
        pipe: function(parser) {
          parser.emit('attachment', attachment1);
          parser.emit('end');
        }
      };

      var emailModule = require(this.testEnv.basePath + '/backend/core/message/email');
      emailModule.saveEmail(stream, author, [], function(err) {
        expect(err).to.exist;
        done();
      });
    });

  });
});
