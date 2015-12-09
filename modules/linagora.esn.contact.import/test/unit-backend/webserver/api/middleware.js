'use strict';

var chai = require('chai');
var expect = chai.expect;

describe('The contact import middleware', function() {

  function checkResponseError(expected, done) {
    return {
      status: function(code) {
        expect(code).to.equal(expected);
        return {
          json: function() {
            done();
          }
        };
      }
    };
  }

  describe('The checkRequiredBody function', function() {

    var req, lib;

    beforeEach(function() {
      lib = {
        importers: {}
      };
      req = {
        params: {
          type: 'twitter'
        },
        token: {
          token: '123'
        },
        user: {
          _id: 1
        }
      };
    });

    var getMiddleware = function() {
      return require('../../../../backend/webserver/api/middleware')(function() {}, lib);
    };

    it('should send back HTTP 400 when req.body is undefined', function(done) {
      getMiddleware().checkRequiredBody(req, checkResponseError(400, done), function() {
        done(new Error());
      });
    });

    it('should send back HTTP 400 when req.body.account_id is undefined', function(done) {
      req.body = {};
      getMiddleware().checkRequiredBody(req, checkResponseError(400, done), function() {
        done(new Error());
      });
    });

    it('should call next when req.body.account_id is defined', function(done) {
      req.body = {account_id: 123456789};
      getMiddleware().checkRequiredBody(req, {
        status: function() {
          done(new Error());
        }
      }, function() {
        done();
      });
    });
  });
});
