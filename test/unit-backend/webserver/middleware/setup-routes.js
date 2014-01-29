'use strict';

var BASEPATH = '../../../..';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The webserver setup-route middleware', function() {

  beforeEach(function() {
    this.configured = false;
    var configuredMock = function() {
      return this.configured;
    };

    mockery.registerMock('../../core', {configured: configuredMock.bind(this)});
  });

  it('should register a callback on the GET / endpoint', function() {
    var registered = {
    };
    var appMock = {
      get: function(path, callback) {
        registered[path] = callback;
      },
      put: function() {}
    };

    require(BASEPATH + '/backend/webserver/middleware/setup-routes')(appMock);

    expect(registered).to.have.property('/');
    expect(registered['/']).to.be.a.function;
  });

  it('should register a callback on the PUT /api/document-store/connection endpoint', function(done) {
    var appMock = {
      put: function(path, callback) {
        expect(path).to.equal('/api/document-store/connection');
        expect(callback).to.be.a.function;
        done();
      },
      get: function() {}
    };

    require(BASEPATH + '/backend/webserver/middleware/setup-routes')(appMock);
  });

  it('should register a callback on the GET /api/document-store/connection/:hostname/:port/:dbname endpoint', function() {
    var registered = {
    };
    var appMock = {
      get: function(path, callback) {
        registered[path] = callback;
      },
      put: function() {}
    };

    require(BASEPATH + '/backend/webserver/middleware/setup-routes')(appMock);

    expect(registered).to.have.property('/api/document-store/connection/:hostname/:port/:dbname');
    expect(registered['/api/document-store/connection/:hostname/:port/:dbname']).to.be.a.function;
  });


  describe('GET / callback', function() {

    it('should call res.render if the system is not yet configured', function(done) {
      this.configured = false;
      var responseMock = {
        render: function(path) {
          expect(path).to.equal('setup/index');
          done();
        }
      };
      var appMock = {
        put: function() {},
        get: function(path, callback) {
          if (path === '/') {
            callback({},responseMock, null);
          }
        }
      };

      require(BASEPATH + '/backend/webserver/middleware/setup-routes')(appMock);
    });

    it('should call next() if the system is configured', function(done) {
      this.configured = true;
      var nextMock = function() {
        done();
      };
      var appMock = {
        put: function() {},
        get: function(path, callback) {
          if (path === '/') {
            callback({},{},nextMock);
          }
        }
      };

      require(BASEPATH + '/backend/webserver/middleware/setup-routes')(appMock);
    });
  });

  describe('PUT /api/document-store/connection callback', function() {

    it('should call next() if the system is not configured', function(done) {
      this.configured = false;
      var nextMock = function() {
        done();
      };
      var appMock = {
        get: function() {},
        put: function(path, callback) {
          callback({},{},nextMock);
        }
      };

      require(BASEPATH + '/backend/webserver/middleware/setup-routes')(appMock);
    });



    it('should call res.json(400) if the system is configured', function(done) {
      this.configured = true;
      var responseMock = {
        json: function(code, body) {
          expect(code).to.equal(400);
          expect(body.error.details).to.equal('the database connection is already configured');
          done();
        }
      };
      var appMock = {
        get: function() {},
        put: function(path, callback) {
          callback({},responseMock, null);
        }
      };

      require(BASEPATH + '/backend/webserver/middleware/setup-routes')(appMock);
    });

  });

  describe('GET /api/document-store/connection/:hostname/:port/:dbname callback', function() {

    it('should call next() if the system is not configured', function(done) {
      this.configured = false;
      var nextMock = function() {
        done();
      };
      var appMock = {
        put: function() {},
        get: function(path, callback) {
          if (path === '/api/document-store/connection/:hostname/:port/:dbname') {
            callback({},{},nextMock);
          }
        }
      };

      require(BASEPATH + '/backend/webserver/middleware/setup-routes')(appMock);
    });



    it('should call res.json(400) if the system is configured', function(done) {
      this.configured = true;
      var responseMock = {
        json: function(code, body) {
          expect(code).to.equal(400);
          expect(body.error.details).to.equal('the database connection is already configured');
          done();
        }
      };
      var appMock = {
        put: function() {},
        get: function(path, callback) {
          if (path === '/api/document-store/connection/:hostname/:port/:dbname') {
            callback({},responseMock, null);
          }
        }
      };

      require(BASEPATH + '/backend/webserver/middleware/setup-routes')(appMock);
    });

  });


});
