'use strict';

var chai = require('chai');
var mockery = require('mockery');
var expect = chai.expect;

describe('The feedback core module', function() {

  var feedback, feedbackObject, error, user, esnConfigMock, mailAdressMock, mailMock, i18nMock;

  beforeEach(function() {
    feedbackObject = {
      subject: 'a subject feedback',
      content: 'a feedback content',
      author: '5478545214554'
    };
    user = {
      _id: '5478545214554',
      firstname: 'a firstname',
      lastname: 'a lastname',
      preferredEmail: 'user@email.org'
    };
    error = new Error('sendEmail error');
    this.helpers.requireBackend('core/db/mongo/models/feedback');
  });

  describe('sendEmail() method', function() {

    it('it should send back error when esnConfig fails', function(done) {
      esnConfigMock = function(key) {
        expect(key).to.equal('mail');
        return {
          forUser: function() {
            return {
              get: function(callback) {
                return callback(error);
              }
            };
          }
        };
      };
      mockery.registerMock('../../core/esn-config', esnConfigMock);
      feedback = this.helpers.requireBackend('core/feedback');
      feedback.sendEmail(feedbackObject, user, function(err, res) {
        expect(err).to.exist;
        expect(res).to.not.exist;
        expect(err.message).to.equal(error.message);
        done();
      });
    });

    it('it should send email ', function(done) {
      mailAdressMock = {
        mail: {
          feedback: 'feedback@open-paas.org'
        }
      };
      esnConfigMock = function(key) {
        expect(key).to.equal('mail');
        return {
          forUser: function() {
            return {
              get: function(callback) {
                return callback(null, mailAdressMock);
              }
            };
          }
        };
      };
      i18nMock = {
        __: function() {
          return 'You received a feedback on OpenPaaS';
        }
      };
      mailMock = {
        getMailer: function() {
          return {
            send: function() {
              return;
            },
            sendHTML: function(messageMock, tmp, contextMock, cb) {
              expect(messageMock).to.deep.equal({
                from: 'user@email.org',
                to: 'feedback@open-paas.org',
                subject: 'You received a feedback on OpenPaaS'
              });
              expect(contextMock).to.deep.equal({
                firstname: 'a firstname',
                lastname: 'a lastname',
                email: 'user@email.org',
                subject: 'a subject feedback',
                content: 'a feedback content'
              });
              expect(tmp).to.deep.equal('core.feedback');
              return cb(null, 'clean');
            }
          };
        }
      };
      mockery.registerMock('../email', mailMock);
      mockery.registerMock('../../i18n', i18nMock);
      mockery.registerMock('../../core/esn-config', esnConfigMock);
      feedback = this.helpers.requireBackend('core/feedback');
      feedback.sendEmail(feedbackObject, user, function(err, res) {
        expect(err).to.not.exist;
        expect(res).to.equal('clean');
        done();
      });
    });
  });
});
