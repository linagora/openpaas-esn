'use strict';

var chai = require('chai');
var mockery = require('mockery');
var expect = chai.expect;

describe('The feedback core module', function() {

  var feedback, feedbackObject, req, sendEmailMock, error;

  beforeEach(function() {
    feedbackObject = {
      subject: 'a subject feedback',
      content: 'a feedback content',
      author: '5478545214554'
    };
    req = {
      user: {
        _id: '123',
        firstname: 'foo',
        lastname: 'bar',
        preferredEmail: 'user@email.org'
      }
    };
    error = new Error('sendEmail error');
    sendEmailMock = function(feedbackObject, req, cb) {
      return {
        get: function(callback) {
          return callback(error);
        }
      };
    };
    feedback = this.helpers.requireBackend('core/feedback');
    mockery.registerMock('../feedback', sendEmailMock);
  });

  describe('getFeedbackEmail() method', function() {

    it('should fail if esnConfig mail search fails', function(done) {
      var user = {
        _id: 123,
        firstname: 'foo',
        lastname: 'bar'
      };
      var error = new Error('mail search fails');
      var esnConfigMock = function(key) {
        expect(key).to.equal('mail');
        return {
          get: function(callback) {
            return callback(error);
          }
        };
      };
      mockery.registerMock('../esn-config', esnConfigMock);
      feedback.getFeedbackEmail(user, function(err, config) {
        expect(err).to.exist;
        expect(config).to.not.exist;
        expect(err.message).to.equal(error.message);
        done();
        });
    });

    it('should return esnConfig for mail key', function(done) {
      var expectedConfig = {
          mail: {
          feedback: 'feedback@open-paas.org'
        }
      };
      var user = {
        _id: 123,
        firstname: 'foo',
        lastname: 'bar'
      };
      var esnConfigMock = function(key) {
        expect(key).to.equal('mail');
        return {
          get: function(callback) {
            return callback(null, expectedConfig);
          }
        };
      };
      mockery.registerMock('../esn-config', esnConfigMock);
      feedback.getFeedbackEmail(user, function(err, config) {
        expect(err).to.not.exist;
        expect(config).to.deep.equal(expectedConfig);
        done();
      });
    });
  });

  describe('sendEmail() method', function() {

    it('should propagate err on error ', function(done) {
      feedback.sendEmail(feedbackObject, req, function(err, res) {
        expect(err).to.exist;
        expect(res).to.not.exist;
        expect(err.message).to.equal(error.message);
        done();
      });
    });

    it('should return res when its ok ', function(done) {
      var expectedRes = function() {};
      var sendEmailMock = function(feedbackObject, req, cb) {
        return {
          get: function(callback) {
            return callback(null, expectedRes);
          }
        };
      };
      mockery.registerMock('../feedback', sendEmailMock);
      feedback.sendEmail(feedbackObject, req, function(err, res) {
        expect(err).to.not.exist;
        expect(res).to.deep.equal(expectedRes);
        done();
      });
    });

  });
});
