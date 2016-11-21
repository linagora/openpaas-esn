'use strict';

var expect = require('chai').expect,
    mockery = require('mockery');

describe('The user login module', function() {
  var mockModels, mockPubSub;

  beforeEach(function() {
    mockModels = this.helpers.mock.models;
    mockPubSub = this.helpers.mock.pubsub;
    mockery.registerMock('../auth', {});
    mockery.registerMock('../../helpers', {});
  });

  describe('The success function', function() {

    beforeEach(function() {
      mockery.registerMock('../esn-config', function() {});
    });

    it('should call loginSuccess of a mongoose User model', function(done) {
      var called = false;
      mockModels({
        User: {
          loadFromEmail: function(email, callback) {
            var user = {
              loginSuccess: function(callback) {
                called = true;
                callback();
              }
            };
            callback(null, user);
          }
        }
      });

      var pubSubStub = {};
      mockPubSub('../pubsub', pubSubStub);

      var login = require('../../../../backend/core/user/login');
      login.success('email', function(err) {
        expect(err).to.not.exist;
        expect(called).to.be.true;
        expect(pubSubStub.topics).to.include('login:success');
        expect(pubSubStub.topics['login:success'].data[0].loginSuccess).to.be.a.function;
        done();
      });
    });

    it('should propagate err on error', function(done) {
      var called = false;
      mockModels({
        User: {
          loadFromEmail: function(email, callback) {
            var user = {
              loginSuccess: function(callback) {
                called = true;
                callback();
              }
            };
            callback(new Error('ERROR'), user);
          }
        }
      });

      var pubSubStub = {};
      mockPubSub('../pubsub', pubSubStub);

      var login = require('../../../../backend/core/user/login');
      login.success('email', function(err) {
        expect(err).to.exist;
        expect(called).to.be.false;
        expect(pubSubStub.topics).to.be.empty;
        done();
      });
    });

    it('should fail if no user is retrieved from the database', function(done) {
      mockModels({
        User: {
          loadFromEmail: function(email, callback) {
            callback(null, null);
          }
        }
      });

      var pubSubStub = {};
      mockPubSub('../pubsub', pubSubStub);

      var login = require('../../../../backend/core/user/login');
      login.success('email', function(err) {
        expect(err).to.exist;
        expect(pubSubStub.topics).to.be.empty;
        done();
      });
    });

  });

  describe('The failure function', function() {

    beforeEach(function() {
      mockery.registerMock('../esn-config', function() {});
    });

    it('should call loginFailuer of a mongoose User model', function(done) {
      var called = false;
      mockModels({
        User: {
          loadFromEmail: function(email, callback) {
            var user = {
              loginFailure: function(callback) {
                called = true;
                callback();
              }
            };
            callback(null, user);
          }
        }
      });

      var pubSubStub = {};
      mockPubSub('../pubsub', pubSubStub);

      var login = require('../../../../backend/core/user/login');
      login.failure('email', function(err) {
        expect(err).to.not.exist;
        expect(called).to.be.true;
        expect(pubSubStub.topics).to.include('login:failure');
        expect(pubSubStub.topics['login:failure'].data[0].loginFailure).to.be.a.function;
        done();
      });
    });

    it('should propagate err on error', function(done) {
      var called = false;
      mockModels({
        User: {
          loadFromEmail: function(email, callback) {
            var user = {
              loginFailure: function(callback) {
                called = true;
                callback();
              }
            };
            callback(new Error('ERROR'), user);
          }
        }
      });

      var pubSubStub = {};
      mockPubSub('../pubsub', pubSubStub);

      var login = require('../../../../backend/core/user/login');
      login.failure('email', function(err) {
        expect(err).to.exist;
        expect(called).to.be.false;
        expect(pubSubStub.topics).to.be.empty;
        done();
      });
    });

    it('should fail if no user is retrieved from the database', function(done) {
      mockModels({
        User: {
          loadFromEmail: function(email, callback) {
            callback(null, null);
          }
        }
      });

      var pubSubStub = {};
      mockPubSub('../pubsub', pubSubStub);

      var login = require('../../../../backend/core/user/login');
      login.failure('email', function(err) {
        expect(err).to.exist;
        expect(pubSubStub.topics).to.be.empty;
        done();
      });
    });

  });

  describe('The canLogin function', function() {

    beforeEach(function() {
      mockery.registerMock('../esn-config', function() {
        return {
          get: function(callback) {
            var data = {
              failure: {
                size: 5
              }
            };
            callback(null, data);
          }
        };
      });
    });

    it('should return true if size is lower than configured value', function(done) {
      mockModels({
        User: {
          loadFromEmail: function(email, callback) {
            callback(null, {
              login: {
                failures: [1, 2, 3, 4]
              }
            });
          }
        }
      });

      var login = require('../../../../backend/core/user/login');
      login.canLogin('email', function(err, result) {
        expect(result).to.be.true;
        done();
      });
    });

    it('should return false if size is equal to configured value', function(done) {
      mockModels({
        User: {
          loadFromEmail: function(email, callback) {
            callback(null, {
              login: {
                failures: [1, 2, 3, 4, 5]
              }
            });
          }
        }
      });

      var login = require('../../../../backend/core/user/login');
      login.canLogin('email', function(err, result) {
        expect(result).to.be.false;
        done();
      });
    });

    it('should return false if size is greater than default value', function(done) {
      mockModels({
        User: {
          loadFromEmail: function(email, callback) {
            callback(null, {
              login: {
                failures: [1, 2, 3, 4, 5, 6]
              }
            });
          }
        }
      });

      var login = require('../../../../backend/core/user/login');
      login.canLogin('email', function(err, result) {
        expect(result).to.be.false;
        done();
      });
    });

    it('should propagate err on error', function(done) {
      mockModels({
        User: {
          loadFromEmail: function(email, callback) {
            callback(new Error('ERROR'), {});
          }
        }
      });

      var pubSubStub = {};
      mockPubSub('../pubsub', pubSubStub);

      var login = require('../../../../backend/core/user/login');
      login.canLogin('email', function(err) {
        expect(err).to.exist;
        expect(pubSubStub.topics).to.be.empty;
        done();
      });
    });

    it('should fail if no user is retrieved from the database', function(done) {
      mockModels({
        User: {
          loadFromEmail: function(email, callback) {
            callback(null, null);
          }
        }
      });

      var pubSubStub = {};
      mockPubSub('../pubsub', pubSubStub);

      var login = require('../../../../backend/core/user/login');
      login.canLogin('email', function(err) {
        expect(err).to.exist;
        expect(pubSubStub.topics).to.be.empty;
        done();
      });
    });

  });

  describe('The sendPasswordReset function', function() {
    var user, helpersMock, errorMessage, data, emailMock, baseUrl;

    beforeEach(function() {
      user = {
        _id: '123',
        firstname: 'name',
        preferredEmail: 'mailto@email.com'
      };
      baseUrl = 'http://open-pass.org:8080';
      errorMessage = 'something wrong';
      data = { message: 'send successfully', url: baseUrl + '/passwordreset'};

      mockModels({
        User: {
          loadFromEmail: function(email, callback) {
            callback(null, null);
          }
        },
        PasswordReset: {
          find: function(email, callback) {
            callback(null, [{_id: '123', email: 'email@mail.com', url: baseUrl + '/passwordreset'}]);
          }
        }
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
      helpersMock = {
        config: {
          getBaseUrl: function(user, callback) {
            callback(new Error(errorMessage));
          },
          getNoReply: function(callback) {
            callback(null, 'no-reply@openpaas.org');
          }
        }
      };

      mockery.registerMock('../../helpers', helpersMock);
      mockery.registerMock('../email', emailMock);
    });

    it('should fail if configHelpers.getBaseUrl get error', function(done) {
      var login = require('../../../../backend/core/user/login');

      login.sendPasswordReset(user, function(err) {
        expect(err.message).to.equal(errorMessage);
        done();
      });
    });

    it('should return noreply address and baseUrl if configHelpers.getBaseUrl run successfully', function(done) {
      helpersMock.config.getBaseUrl = function(user, callback) {
        callback(null, baseUrl);
      };
      var login = require('../../../../backend/core/user/login');

      login.sendPasswordReset(user, function(err, message) {
        expect(err).to.not.exist;
        expect(message).to.deep.equal(data);
        done();
      });
    });

    it('should fail if email.getMailer().sendHTML get error', function(done) {
      emailMock.getMailer = function(user) {
        return {
          sendHTML: function(message, templateName, context, callback) {
            callback(new Error(errorMessage));
          }
        };
      };
      var login = require('../../../../backend/core/user/login');

      login.sendPasswordReset(user, function(err) {
        expect(err.message).to.equal(errorMessage);
        done();
      });
    });

    it('should return data if email.getMailer(user).sendHTML send mail successfully', function(done) {
      helpersMock.config.getBaseUrl = function(user, callback) {
        callback(null, baseUrl);
      };
      emailMock.getMailer = function(user) {
        return {
          sendHTML: function(message, templateName, context, callback) {
            callback(null, data);
          }
        };
      };
      var login = require('../../../../backend/core/user/login');

      login.sendPasswordReset(user, function(err, message) {
        expect(err).to.not.exist;
        expect(message).to.deep.equal(data);
        done();
      });
    });

    it('should send url with baseUrl of url in passwordreset of user if the baseUrl equal baseUrl of web config', function(done) {
      helpersMock.config.getBaseUrl = function(user, callback) {
        callback(null, baseUrl);
      };
      emailMock.getMailer = function(user) {
        return {
          sendHTML: function(message, templateName, context, callback) {
            callback(null, data);
          }
        };
      };
      var login = require('../../../../backend/core/user/login');

      login.sendPasswordReset(user, function(err, message) {
        expect(err).to.not.exist;
        expect(message.url).to.equal(baseUrl + '/passwordreset');
        done();
      });
    });

    it('should send url with baseUrl of web config if the baseUrl equal baseUrl of url in passwordreset of user', function(done) {
      var newBaseUrl = 'http://abc.com:8080';

      helpersMock.config.getBaseUrl = function(user, callback) {
        callback(null, newBaseUrl);
      };

      data.url = newBaseUrl + '/passwordreset';
      emailMock.getMailer = function(user) {
        return {
          sendHTML: function(message, templateName, context, callback) {
            callback(null, data);
          }
        };
      };
      var auth = {
        jwt: {
          generateWebToken: function(payload, callback) {
            callback(null, newBaseUrl + '/passwordreset');
          }
        }
      };
      mockery.registerMock('../auth', auth);
      mockModels({
        PasswordReset: {
          find: function(email, callback) {
            callback(null, [{_id: '123', email: 'email@mail.com', url: baseUrl + '/passwordreset'}]);
          },
          findOneAndUpdate: function(email, command, callback) {
            callback(null, [{email: 'email@mail.com', url: newBaseUrl + '/passwordreset'}]);
          }
        }
      });

      var login = require('../../../../backend/core/user/login');

      login.sendPasswordReset(user, function(err, message) {
        expect(err).to.not.exist;
        expect(message.url).to.equal(newBaseUrl + '/passwordreset');
        done();
      });
    });
  });
});
