'use strict';

const expect = require('chai').expect;
const mockery = require('mockery');

describe('The domain middleware', function() {

  describe('The load domain middleware', function() {

    it('should send 400 if domain Id is not valid ObjectID', function(done) {
      mockery.registerMock('mongoose', {
        model: function() {
          return {
            loadFromID: function(id, callback) {
              return callback();
            }
          };
        }
      });
      mockery.registerMock('../../helpers', {
        db: {
          isValidObjectId: function() { return false; }
        }
      });

      const req = {
        params: {
          uuid: 'invalid'
        }
      };
      const res = this.helpers.express.response(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      const next = function() {};
      const middleware = this.helpers.requireBackend('webserver/middleware/domain');

      middleware.load(req, res, next);
    });

    it('should call next(err) if domain can not be loaded', function(done) {
      mockery.registerMock('mongoose', {
        model: function() {
          return {
            loadFromID: function(id, callback) {
              return callback(new Error());
            }
          };
        }
      });
      mockery.registerMock('../../helpers', {
        db: {
          isValidObjectId: function() { return true; }
        }
      });

      const req = {
        params: {
          uuid: '123'
        }
      };
      const res = {};
      const next = function(err) {
        expect(err).to.exist;
        done();
      };
      const middleware = this.helpers.requireBackend('webserver/middleware/domain');

      middleware.load(req, res, next);
    });

    it('should send 404 if domain is not found', function(done) {
      mockery.registerMock('mongoose', {
        model: function() {
          return {
            loadFromID: function(id, callback) {
              return callback();
            }
          };
        }
      });
      mockery.registerMock('../../helpers', {
        db: {
          isValidObjectId: function() { return true; }
        }
      });

      const req = {
        params: {
          uuid: 123
        }
      };

      const res = this.helpers.express.response(
        function(code) {
          expect(code).to.equal(404);
          done();
        }
      );
      const next = function() {};

      const middleware = this.helpers.requireBackend('webserver/middleware/domain');
      middleware.load(req, res, next);
    });

    it('should inject the domain into the request', function(done) {
      const domain = {_id: 123};

      mockery.registerMock('mongoose', {
        model: function() {
          return {
            loadFromID: function(id, callback) {
              return callback(null, domain);
            }
          };
        }
      });
      mockery.registerMock('../../helpers', {
        db: {
          isValidObjectId: function() { return true; }
        }
      });

      const req = {
        params: {
          uuid: 123
        }
      };

      const res = {
      };

      const next = function() {
        expect(req.domain).to.exist;
        expect(req.domain).to.deep.equal(domain);
        done();
      };

      const middleware = this.helpers.requireBackend('webserver/middleware/domain');
      middleware.load(req, res, next);
    });
  });

  describe('loadFromDomainIdParameter() method', function() {
    it('should send back 400 when param is undefined', function(done) {
      this.helpers.mock.models({});

      const req = {
        query: {}
      };
      const res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      const mw = this.helpers.requireBackend('webserver/middleware/domain');
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

      const req = {
        query: {
          domain_id: '123'
        }
      };
      const res = {};
      const next = function(err) {
        expect(err).to.exist;
        done();
      };

      const mw = this.helpers.requireBackend('webserver/middleware/domain');
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

      const req = {
        query: {
          domain_id: '123'
        }
      };

      const res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(404);
          done();
        }
      );
      const next = function() {};

      const mw = this.helpers.requireBackend('webserver/middleware/domain');
      mw.loadFromDomainIdParameter(req, res, next);
    });

    it('should inject the domain into the request', function(done) {
      const domain = {_id: 123};
      this.helpers.mock.models({
        Domain: {
          loadFromID: function(id, callback) {
            return callback(null, domain);
          }
        }
      });

      const req = {
        query: {
          domain_id: '123'
        }
      };

      const res = {
      };

      const next = function() {
        expect(req.domain).to.exist;
        expect(req.domain).to.deep.equal(domain);
        done();
      };

      const mw = this.helpers.requireBackend('webserver/middleware/domain');
      mw.loadFromDomainIdParameter(req, res, next);
    });

  });
});
