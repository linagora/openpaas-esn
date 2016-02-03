'use strict';

var chai = require('chai');
var expect = chai.expect;

describe('The contact import controller', function() {

  var deps = {
    logger: {
      debug: console.log,
      info: console.log,
      error: console.log
    }
  };

  var dependencies = function(name) {
    return deps[name];
  };

  describe('The importContacts function', function() {

    var req;
    beforeEach(function() {
      req = {
        user: {
          _id: 1
        },
        account: {
          _id: 2
        }
      };
    });

    var getController = function(lib) {
      return require('../../../../backend/webserver/api/controller')(dependencies, lib);
    };

    it('should call importAccountContactsByJobQueue with the right parameters', function(done) {
      var lib = {
        importAccountContactsByJobQueue: function(user, account) {
          expect(user).to.equal(req.user);
          expect(account).to.deep.equal(req.account);
          done();
        }
      };

      getController(lib).importContacts(req, {
        status: function() {
          return {
            end: function() {}
          };
        }
      });
    });

    it('should send back HTTP 202 immediately', function(done) {
      var lib = {
        importAccountContactsByJobQueue: function() {}
      };

      getController(lib).importContacts(req, {
        status: function(code) {
          expect(code).to.equal(202);
          return {
            end: done
          };
        }
      });
    });
  });
});
