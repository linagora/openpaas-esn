'use strict';

const expect = require('chai').expect;

describe('The configuration middleware', function() {
  let middleware;

  beforeEach(function() {
    middleware = this.helpers.requireBackend('webserver/middleware/configuration');
  });

  describe('The canWriteAdminConfig fn', function() {

    it('should send back 400 when one of modules is undefined', function(done) {
      const req = {
        body: [{ name: 'module1', configurations: [] }, undefined]
      };
      const res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      middleware.canWriteAdminConfig(req, res);
    });

    it('should send back 400 when one of modules has configurations is not an array', function(done) {
      const req = {
        body: [{ name: 'module1', configurations: [] }, { name: 'module1', configurations: {} }]
      };
      const res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      middleware.canWriteAdminConfig(req, res);
    });

    it('should send back 400 when one of modules has configurations which one of them is undefined', function(done) {
      const req = {
        body: [{ name: 'module1', configurations: [] }, { name: 'module1', configurations: [{}, undefined] }]
      };
      const res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      middleware.canWriteAdminConfig(req, res);
    });

    it('should send back 400 when role hasn\'t write permission on admin configuration', function(done) {
      const req = {
        body: [{ name: 'module1', configurations: [{ name: 'conf1', value: 'value1' }] }]
      };
      const res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      middleware.canWriteAdminConfig(req, res);
    });

    it('should pass when role has write permission on admin configuration ', function(done) {
      const req = {
        body: [{ name: 'core', configurations: [{ name: 'jwt', value: 'value1' }] }]
      };
      const res = {};
      const next = function(err) {
        expect(err).to.not.exist;
        done();
      };

      middleware.canWriteAdminConfig(req, res, next);
    });
  });

  describe('The canReadAdminConfig fn', function() {

    it('should send back 400 when one of modules is undefined', function(done) {
      const req = {
        body: [{ name: 'module1', keys: [] }, undefined]
      };
      const res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      middleware.canReadAdminConfig(req, res);
    });

    it('should send back 400 when one of modules has keys is not an array', function(done) {
      const req = {
        body: [{ name: 'module1', keys: [] }, { name: 'module1', keys: {} }]
      };
      const res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      middleware.canReadAdminConfig(req, res);
    });

    it('should send back 400 when role hasn\'t read permission on admin configuration', function(done) {
      const req = {
        body: [{ name: 'module1', keys: ['key1'] }]
      };
      const res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      middleware.canReadAdminConfig(req, res);
    });

    it('should pass when role has read permission on admin configuration ', function(done) {
      const req = {
        body: [{ name: 'core', keys: ['jwt'] }]
      };
      const res = {};
      const next = function(err) {
        expect(err).to.not.exist;
        done();
      };

      middleware.canReadAdminConfig(req, res, next);
    });
  });

  describe('The canWritePlatformConfig fn', function() {

    it('should send back 400 when one of modules is undefined', function(done) {
      const req = {
        body: [{ name: 'module1', configurations: [] }, undefined]
      };
      const res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      middleware.canWritePlatformConfig(req, res);
    });

    it('should send back 400 when one of modules has configurations is not an array', function(done) {
      const req = {
        body: [{ name: 'module1', configurations: [] }, { name: 'module1', configurations: {} }]
      };
      const res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      middleware.canWritePlatformConfig(req, res);
    });

    it('should send back 400 when one of modules has configurations which one of them is undefined', function(done) {
      const req = {
        body: [{ name: 'module1', configurations: [] }, { name: 'module1', configurations: [{}, undefined] }]
      };
      const res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      middleware.canWritePlatformConfig(req, res);
    });

    it('should send back 400 when role hasn\'t write permission on platform configuration', function(done) {
      const req = {
        body: [{ name: 'module1', configurations: [{ name: 'conf1', value: 'value1' }] }]
      };
      const res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      middleware.canWritePlatformConfig(req, res);
    });

    it('should pass when role has write permission on platform configuration ', function(done) {
      const req = {
        body: [{ name: 'core', configurations: [{ name: 'jwt', value: 'value1' }] }]
      };
      const res = {};
      const next = function(err) {
        expect(err).to.not.exist;
        done();
      };

      middleware.canWritePlatformConfig(req, res, next);
    });
  });

  describe('The canReadPlatformConfig fn', function() {

    it('should send back 400 when one of modules is undefined', function(done) {
      const req = {
        body: [{ name: 'module1', keys: [] }, undefined]
      };
      const res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      middleware.canReadPlatformConfig(req, res);
    });

    it('should send back 400 when one of modules has keys is not an array', function(done) {
      const req = {
        body: [{ name: 'module1', keys: [] }, { name: 'module1', keys: {} }]
      };
      const res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      middleware.canReadPlatformConfig(req, res);
    });

    it('should send back 400 when role hasn\'t read permission on platform configuration', function(done) {
      const req = {
        body: [{ name: 'module1', keys: ['key1'] }]
      };
      const res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      middleware.canReadPlatformConfig(req, res);
    });

    it('should pass when role has read permission on platform configuration ', function(done) {
      const req = {
        body: [{ name: 'core', keys: ['jwt'] }]
      };
      const res = {};
      const next = function(err) {
        expect(err).to.not.exist;
        done();
      };

      middleware.canReadPlatformConfig(req, res, next);
    });
  });
});
