'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The domain middleware', function() {

  describe('The load domain middleware', function() {

    it('should call next(err) if domain can not be loaded', function(done) {

      var mock = {
        model: function() {
          return {
            loadFromID: function(id, callback) {
              return callback(new Error());
            }
          };
        }
      };
      mockery.registerMock('mongoose', mock);

      var req = {
        params: {
          uuid: '123'
        }
      };
      var res = {};
      var next = function(err) {
        expect(err).to.exist;
        done();
      };

      var middleware = this.helpers.requireBackend('webserver/middleware/domain');
      middleware.load(req, res, next);
    });

    it('should send 404 if domain is not found', function(done) {

      var mock = {
        model: function() {
          return {
            loadFromID: function(id, callback) {
              return callback();
            }
          };
        }
      };
      mockery.registerMock('mongoose', mock);

      var req = {
        params: {
          uuid: 123
        }
      };

      var res = {
        send: function(code) {
          expect(code).to.equal(404);
          done();
        }
      };
      var next = function() {};

      var middleware = this.helpers.requireBackend('webserver/middleware/domain');
      middleware.load(req, res, next);
    });

    it('should inject the domain into the request', function(done) {

      var domain = {_id: 123};
      var mock = {
        model: function() {
          return {
            loadFromID: function(id, callback) {
              return callback(null, domain);
            }
          };
        }
      };
      mockery.registerMock('mongoose', mock);
      var req = {
        params: {
          uuid: 123
        }
      };

      var res = {
      };

      var next = function() {
        expect(req.domain).to.exist;
        expect(req.domain).to.deep.equal(domain);
        done();
      };

      var middleware = this.helpers.requireBackend('webserver/middleware/domain');
      middleware.load(req, res, next);
    });
  });

  describe('loadFromDomainIdParameter() method', function() {
    it('should send back 400 when param is undefined', function(done) {
      this.helpers.mock.models({});

      var req = {
        query: {}
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      var mw = this.helpers.requireBackend('webserver/middleware/domain');
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
        query: {
          domain_id: '123'
        }
      };
      var res = {};
      var next = function(err) {
        expect(err).to.exist;
        done();
      };

      var mw = this.helpers.requireBackend('webserver/middleware/domain');
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
        query: {
          domain_id: '123'
        }
      };

      var res = {
        json: function(code) {
          expect(code).to.equal(404);
          done();
        }
      };
      var next = function() {};

      var mw = this.helpers.requireBackend('webserver/middleware/domain');
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
        query: {
          domain_id: '123'
        }
      };

      var res = {
      };

      var next = function() {
        expect(req.domain).to.exist;
        expect(req.domain).to.deep.equal(domain);
        done();
      };

      var mw = this.helpers.requireBackend('webserver/middleware/domain');
      mw.loadFromDomainIdParameter(req, res, next);
    });

  });
});
