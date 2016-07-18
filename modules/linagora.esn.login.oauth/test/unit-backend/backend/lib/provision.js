'use strict';

var chai = require('chai');
var mockery = require('mockery');
var sinon = require('sinon');
var expect = chai.expect;

describe('The login oauth provision module', function() {
  var deps;
  var configMock;
  var logger = {
    debug: function() {},
    info: function() {},
    warn: function() {}
  };

  var user = {
    _id: 1
  };

  var config = function() {
    return configMock;
  };
  var dependencies = function(name) {
    return deps[name];
  };

  beforeEach(function() {
    configMock = {};
    deps = {
      logger: logger,
      config: config
    };
  });

  describe('The provision function', function() {
    function getModule() {
      return require('../../../../backend/lib/provision')(dependencies);
    }

    it('should reject when domain.getUserDomains resolution fails', function(done) {
      var msg = 'Domain resolution failure';

      deps.domain = {
        list: function(options, callback) {
          callback(new Error(msg));
        }
      };

      getModule().provision(user).then(done, function(err) {
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

      getModule().provision(user).then(done, function(err) {
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

      deps.user = {
        provisionUser: function(user, callback) {
          callback(new Error(msg));
        }
      };

      getModule().provision(user).then(done, function(err) {
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

      deps.user = {
        provisionUser: function(user, callback) {
          callback(null, user);
        }
      };

      getModule().provision(user).then(function() {
        done();
      }, done);
    });
  });
});
