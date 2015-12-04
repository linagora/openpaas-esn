'use strict';

var chai = require('chai');
var expect = chai.expect;
var q = require('q');

describe('The contact import controller', function() {

  describe('The importContacts function', function() {

    var req;
    beforeEach(function() {
      req = {
        body: {
          account_id: '321'
        },
        token: {
          token: '123'
        },
        user: {
          _id: 1
        }
      };
    });

    var getController = function() {
      return require('../../../../backend/webserver/api/controller')();
    };

    it('should send back HTTP 500 when import rejects', function(done) {
      req.importer = {
        importContact: function(options) {
          expect(options.esnToken).to.equal(req.token.token);
          expect(options.user).to.deep.equal(req.user);
          expect(options.accountId).to.deep.equal(req.body.account_id);
          return q.reject(new Error('Import failure'));
        }
      };

      getController().importContacts(req, {
        status: function(code) {
          expect(code).to.equal(500);
          return {
            json: function() {
              done();
            }
          };
        }
      });
    });

    it('should send back HTTP 202 when import is resolved', function(done) {
      req.importer = {
        importContact: function(options) {
          expect(options.esnToken).to.equal(req.token.token);
          expect(options.user).to.deep.equal(req.user);
          expect(options.accountId).to.deep.equal(req.body.account_id);
          return q.when({});
        }
      };

      getController().importContacts(req, {
        status: function(code) {
          expect(code).to.equal(202);
          return {
            json: function() {
              done();
            }
          };
        }
      });
    });
  });
});
