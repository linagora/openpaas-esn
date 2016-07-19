'use strict';

var chai = require('chai');
var mockery = require('mockery');
var sinon = require('sinon');
var expect = chai.expect;

describe('The login oauth provision module', function() {
  var deps;
  var requestMock;
  var configMock;
  var storeModule;
  var userModule;
  var logger = {
    debug: function() {},
    info: function() {},
    warn: function() {}
  };

  var user = {
    _id: 1
  };

  var profile = {
    emails: [{value: 'foo@bar.com'}],
    provider: 'foo'
  };

  var account = {
    name: 'Foo Bar'
  };

  var config = function() {
    return configMock;
  };

  var dependencies = function(name) {
    return deps[name];
  };

  beforeEach(function() {
    userModule = {
      recordUser: function(user, callback) {
        callback(null, user);
      }
    };

    storeModule = {
      store: function(id, contentType, metadata, stream, options, callback) {
        callback();
      }
    };

    requestMock = {
      head: function(uri, callback) {
        callback(null, {
          headers: {'content-type': ''}
        });
      },
      get: function(uri) {
      }
    };

    mockery.registerMock('request', requestMock);

    configMock = {};
    deps = {
      logger: logger,
      config: config,
      store: storeModule,
      user: userModule
    };
  });

  describe('The provision function', function() {
    function getModule() {
      return require('../../../../../backend/lib/provision')(dependencies);
    }

    it('should reject when domain.getUserDomains resolution fails', function(done) {
      var msg = 'Domain resolution failure';

      deps.domain = {
        list: function(options, callback) {
          callback(new Error(msg));
        }
      };

      getModule().provision(profile, account).then(done, function(err) {
        expect(err.message).to.equals(msg);
        done();
      });
    });

    it('should reject when no domains are found', function(done) {

      deps.domain = {
        list: function(options, callback) {
          callback();
        }
      };

      getModule().provision(profile, account).then(done, function(err) {
        expect(err.message).to.match(/Can not find any domain/);
        done();
      });
    });

    it('should reject when user provisioning fails', function(done) {
      var msg = 'Provisioning failure';
      deps.domain = {
        list: function(options, callback) {
          callback(null, [{_id: 1}]);
        }
      };

      deps.user.provisionUser = function(user, callback) {
        callback(new Error(msg));
      };

      getModule().provision(profile, account).then(done, function(err) {
        expect(err.message).to.equals(msg);
        done();
      });
    });

    it('should provision user', function(done) {
      deps.domain = {
        list: function(options, callback) {
          callback(null, [{_id: 1}]);
        }
      };

      deps.user.provisionUser = function(user, callback) {
        callback(null, user);
      };

      getModule().provision(profile, account).then(function() {
        done();
      }, done);
    });

    describe('When user is provisioned', function() {

      var avatarURL = 'http://avatar.me/123';

      beforeEach(function() {
        deps.domain = {
          list: function(options, callback) {
            callback(null, [{_id: 1}]);
          }
        };

        deps.user.provisionUser = function(user, callback) {
          callback(null, user);
        };

        mockery.registerMock('./myprovider', {
          profileToUser: function(user) {
            user.avatarURL = avatarURL;
            return user;
          }
        });

        profile.provider = 'myprovider';
      });

      it('should not fail when avatar can not be downloaded', function(done) {

        requestMock.head = sinon.spy(function(uri, callback) {
          expect(uri).to.equal(avatarURL);
          callback(new Error('Can not get avatar'));
        });

        getModule().provision(profile, account).then(function() {
          expect(requestMock.head).to.have.been.calledOnce;
          done();
        }, done);
      });

      it('should not fail when avatar can not be stored', function(done) {
        deps.store.store = sinon.spy(function(id, mime, metadata, stream, options, callback) {
          callback(new Error('Can not save avatar'));
        });

        getModule().provision(profile, account).then(function() {
          expect(deps.store.store).to.have.been.calledOnce;
          done();
        }, done);

      });

      it('should not fail when avatar can not be added to user profile', function(done) {
        deps.user.recordUser = sinon.spy(function(user, callback) {
          callback(new Error('Can not get avatar'));
        });

        getModule().provision(profile, account).then(function() {
          expect(deps.user.recordUser).to.have.been.calledOnce;
          done();
        }, done);
      });
    });
  });
});
