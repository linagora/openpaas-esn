'use strict';

const expect = require('chai').expect;
const mockery = require('mockery');

describe('The user password core module', function() {
  let mockModels;

  beforeEach(function() {
    mockModels = this.helpers.mock.models;
  });

  describe('The checkPassword function', function() {
    let user, errorMessage;

    beforeEach(function() {
      errorMessage = 'The passwords do not match.';
      user = {
        _id: 123,
        firstname: 'name',
        password: 'abc',
        comparePassword: function(password, callback) {
          return callback(null, false);
        }
      };

      mockModels({
        User: {}
      });
    });

    it('should return errorMessage equals "The passwords do not match." if the passwords do not match', function(done) {
      const userPassword = require('../../../../backend/core/user/password');

      userPassword.checkPassword(user, 'bcd', function(err) {
        expect(err.message).to.equal(errorMessage);
        done();
      });
    });

    it('should return null if the passwords match', function(done) {
      user.comparePassword = function(password, callback) {
        return callback(null, true);
      };
      const userPassword = require('../../../../backend/core/user/password');

      userPassword.checkPassword(user, 'abc', function(err) {
        expect(err).to.not.exist;
        done();
      });
    });

    it('should return errorMessage equal "The passwords do not match." if user.comparePassword failed', function(done) {
      user.comparePassword = function(password, callback) {
        return callback(new Error());
      };
      const userPassword = require('../../../../backend/core/user/password');

      userPassword.checkPassword(user, 'abc', function(err) {
        expect(err.message).to.equal(errorMessage);
        done();
      });
    });
  });

  describe('The updatePassword function', function() {
    let user, errorMessage;

    beforeEach(function() {
      errorMessage = 'something wrong';
      user = {
        _id: 123,
        firstname: 'name',
        password: 'abc',
        save: function(callback) {
          callback(null);
        }
      };

      mockModels({
        User: {
          findOne: function(user, callback) {
            callback(new Error(errorMessage));
          }
        }
      });
    });

    it('should fail if cannot find user', function(done) {
      const userPassword = require('../../../../backend/core/user/password');

      userPassword.updatePassword(user, 'bcd', function(err) {
        expect(err.message).to.equal(errorMessage);
        done();
      });
    });

    it('should call callback if can get user', function(done) {
      mockModels({
        User: {
          findOne: function(obj, callback) {
            callback(null, user);
          }
        }
      });
      const userPassword = require('../../../../backend/core/user/password');

      userPassword.updatePassword(user, 'abc', done);
    });
  });

  describe('The sendPasswordChangedConfirmation function', function() {
    let user, configHelperMock, errorMessage, data, emailMock, baseUrl;

    beforeEach(function() {
      user = {
        _id: '123',
        firstname: 'name',
        preferredEmail: 'mailto@email.com'
      };
      baseUrl = 'http://open-pass.org:8080';
      errorMessage = 'something wrong';
      data = { message: 'send successfully', url: baseUrl};

      mockModels({
        User: {}
      });
      emailMock = {
        getMailer: function(user) {
          return {
            sendHTML: function(message, templateName, context, callback) {
              callback(null, data);
            }
          };
        }
      };
      configHelperMock = {
        getBaseUrl: function(user, callback) {
          callback(new Error(errorMessage));
        }
      };

      mockery.registerMock('../../helpers/config', configHelperMock);
      mockery.registerMock('../email', emailMock);
    });

    it('should fail if emailModule.getMailer(user) fail', function(done) {
      emailMock = {
        getMailer: function(user) {
          throw new Error(errorMessage);
        }
      };
      const userPassword = require('../../../../backend/core/user/password');

      userPassword.sendPasswordChangedConfirmation(user, 'core.change-password-confirmation', function(err) {
        expect(err.message).to.equal(errorMessage);
        done();
      });
    });

    it('should call sendHTML if emailModule.getMailer(user) is successfully', function(done) {
      configHelperMock.getBaseUrl = function(user, callback) {
        callback(null, baseUrl);
      };
      emailMock = {
        getMailer: function(user) {
          return {
            sendHTML: function(message, templateName, context, callback) {
              callback(null, data);
            }
          };
        }
      };
      const userPassword = require('../../../../backend/core/user/password');

      userPassword.sendPasswordChangedConfirmation(user, 'core.change-password-confirmation', function(err, message) {
        expect(err).to.not.exist;
        expect(message).to.deep.equal(data);
        done();
      });
    });

    it('should fail if configHelper.getBaseUrl get error', function(done) {
      const userPassword = require('../../../../backend/core/user/password');

      userPassword.sendPasswordChangedConfirmation(user, 'core.change-password-confirmation', function(err) {
        expect(err.message).to.equal(errorMessage);
        done();
      });
    });

    it('should callback with baseUrl of web config if configHelper.getBaseUrl successfully', function(done) {
      configHelperMock.getBaseUrl = function(user, callback) {
        callback(null, baseUrl);
      };
      const userPassword = require('../../../../backend/core/user/password');

      userPassword.sendPasswordChangedConfirmation(user, 'core.change-password-confirmation', function(err, message) {
        expect(err).to.not.exist;
        expect(message.url).to.equal(baseUrl);
        done();
      });
    });

    it('should fail if email.getMailer(user).sendHTML get error', function(done) {
      configHelperMock.getBaseUrl = function(user, callback) {
        callback(null, baseUrl);
      };
      emailMock.getMailer = function(user) {
        return {
          sendHTML: function(message, templateName, context, callback) {
            callback(new Error(errorMessage));
          }
        };
      };
      const userPassword = require('../../../../backend/core/user/password');

      userPassword.sendPasswordChangedConfirmation(user, 'core.change-password-confirmation', function(err) {
        expect(err.message).to.equal(errorMessage);
        done();
      });
    });

    it('should callback with data if email.getMailer(user).sendHTML send mail successfully', function(done) {
      configHelperMock.getBaseUrl = function(user, callback) {
        callback(null, baseUrl);
      };
      emailMock.getMailer = function(user) {
        return {
          sendHTML: function(message, templateName, context, callback) {
            callback(null, data);
          }
        };
      };
      const userPassword = require('../../../../backend/core/user/password');

      userPassword.sendPasswordChangedConfirmation(user, 'core.change-password-confirmation', function(err, message) {
        expect(err).to.not.exist;
        expect(message).to.deep.equal(data);
        done();
      });
    });

    it('should call callback fn without error if configHelper.getBaseUrl get baseUrl of webconfig and email.getMailer(user).sendHTML send mail successfully', function(done) {
      configHelperMock.getBaseUrl = function(user, callback) {
        callback(null, baseUrl);
      };
      const userPassword = require('../../../../backend/core/user/password');

      userPassword.sendPasswordChangedConfirmation(user, 'core.change-password-confirmation', done);
    });
  });
});
