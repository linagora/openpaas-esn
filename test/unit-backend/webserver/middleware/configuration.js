'use strict';

const expect = require('chai').expect;
const mockery = require('mockery');

describe('The configuration middleware', function() {
  let middleware, rightsMock;

  beforeEach(function() {
    rightsMock = {};

    mockery.registerMock('../../core/esn-config/rights', rightsMock);
    middleware = this.helpers.requireBackend('webserver/middleware/configuration');
  });

  describe('The canWriteAdminConfig fn', function() {

    beforeEach(function() {
      Object.assign(rightsMock, {
        adminCanWrite() { return true; }
      });
    });

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

    it('should send back 400 when config is not writable by admin', function(done) {
      const req = {
        body: [{ name: 'module', configurations: [{ name: 'name', value: 'value' }] }]
      };
      const res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      rightsMock.adminCanWrite = () => false;
      middleware.canWriteAdminConfig(req, res);
    });

    it('should pass when config is writable by admin ', function(done) {
      const req = {
        body: [{ name: 'module', configurations: [{ name: 'name', value: 'value' }] }]
      };
      const res = {};
      const next = function(err) {
        expect(err).to.not.exist;
        done();
      };

      rightsMock.adminCanWrite = () => true;
      middleware.canWriteAdminConfig(req, res, next);
    });
  });

  describe('The canReadAdminConfig fn', function() {

    beforeEach(function() {
      Object.assign(rightsMock, {
        adminCanRead() { return true; }
      });
    });

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

    it('should send back 400 when config is not readable by admin', function(done) {
      const req = {
        body: [{ name: 'module', keys: ['key1'] }]
      };
      const res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      rightsMock.adminCanRead = () => false;
      middleware.canReadAdminConfig(req, res);
    });

    it('should pass when role has read permission on admin configuration ', function(done) {
      const req = {
        body: [{ name: 'module', keys: ['key1'] }]
      };
      const res = {};
      const next = function(err) {
        expect(err).to.not.exist;
        done();
      };

      rightsMock.adminCanRead = () => true;
      middleware.canReadAdminConfig(req, res, next);
    });
  });

  describe('The canWritePlatformConfig fn', function() {

    beforeEach(function() {
      Object.assign(rightsMock, {
        padminCanWrite() { return true; }
      });
    });

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

    it('should send back 400 when config is not writable by platform admin', function(done) {
      const req = {
        body: [{ name: 'module', configurations: [{ name: 'name', value: 'value' }] }]
      };
      const res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      rightsMock.padminCanWrite = () => false;
      middleware.canWritePlatformConfig(req, res);
    });

    it('should pass when config is writable by platform admin', function(done) {
      const req = {
        body: [{ name: 'module', configurations: [{ name: 'name', value: 'value' }] }]
      };
      const res = {};
      const next = function(err) {
        expect(err).to.not.exist;
        done();
      };

      rightsMock.padminCanWrite = () => true;
      middleware.canWritePlatformConfig(req, res, next);
    });
  });

  describe('The canReadPlatformConfig fn', function() {

    beforeEach(function() {
      Object.assign(rightsMock, {
        padminCanRead() { return true; }
      });
    });

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

    it('should send back 400 when config is not readable by platform admin', function(done) {
      const req = {
        body: [{ name: 'module', keys: ['key1'] }]
      };
      const res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      rightsMock.padminCanRead = () => false;
      middleware.canReadPlatformConfig(req, res);
    });

    it('should pass when config is readable by platform admin ', function(done) {
      const req = {
        body: [{ name: 'module', keys: ['key1'] }]
      };
      const res = {};
      const next = function(err) {
        expect(err).to.not.exist;
        done();
      };

      rightsMock.padminCanRead = () => true;
      middleware.canReadPlatformConfig(req, res, next);
    });
  });
});
