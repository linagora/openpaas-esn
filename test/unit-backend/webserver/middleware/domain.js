'use strict';

var expect = require('chai').expect;

describe('The domain middleware', function() {

  describe('loadFromDomainIdParameter() method', function() {
    it('should send back 400 when param is undefined', function(done) {
      this.helpers.mock.models({});

      var req = {
        param: function() {
          return null;
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      var mw = require(this.testEnv.basePath + '/backend/webserver/middleware/domain');
      mw.loadFromDomainIdParameter(req, res);
    });

    it('should call next(err) if domain can not be loaded', function(done) {
      this.helpers.mock.models({
        Domain: {
          loadFromID: function(id, callback) {
            return callback(new Error());
          }
        }
      });

      var req = {
        param: function() {
          return '123';
        }
      };
      var res = {};
      var next = function(err) {
        expect(err).to.exist;
        done();
      };

      var mw = require(this.testEnv.basePath + '/backend/webserver/middleware/domain');
      mw.loadFromDomainIdParameter(req, res, next);
    });

    it('should send 404 if domain is not found', function(done) {
      this.helpers.mock.models({
        Domain: {
          loadFromID: function(id, callback) {
            return callback();
          }
        }
      });

      var req = {
        param: function() {
          return '123';
        }
      };

      var res = {
        json: function(code) {
          expect(code).to.equal(404);
          done();
        }
      };
      var next = function() {};

      var mw = require(this.testEnv.basePath + '/backend/webserver/middleware/domain');
      mw.loadFromDomainIdParameter(req, res, next);
    });

    it('should inject the domain into the request', function(done) {
      var domain = {_id: 123};
      this.helpers.mock.models({
        Domain: {
          loadFromID: function(id, callback) {
            return callback(null, domain);
          }
        }
      });

      var req = {
        param: function() {
          return '123';
        }
      };

      var res = {
      };

      var next = function() {
        expect(req.domain).to.exist;
        expect(req.domain).to.deep.equal(domain);
        done();
      };

      var mw = require(this.testEnv.basePath + '/backend/webserver/middleware/domain');
      mw.loadFromDomainIdParameter(req, res, next);
    });

  });
});
