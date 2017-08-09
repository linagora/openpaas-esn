'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The templates middleware', function() {

  var middleware, req, ESN_CUSTOM_TEMPLATES_FOLDER;

  beforeEach(function() {
    ESN_CUSTOM_TEMPLATES_FOLDER = process.env.ESN_CUSTOM_TEMPLATES_FOLDER;
    var pathMock = {
      normalize: function(path) {
        return path;
      }
    };
    mockery.registerMock('path', pathMock);
    req = {
      params: [
        'path'
      ]
    };
  });

  afterEach(function() {
    process.env.ESN_CUSTOM_TEMPLATES_FOLDER = ESN_CUSTOM_TEMPLATES_FOLDER;
  });

  it('should change path to custom/path if ESN_CUSTOM_TEMPLATES_FOLDER is not set', function(done) {
    delete process.env.ESN_CUSTOM_TEMPLATES_FOLDER;
    var next = function() {
      expect(req.params[0]).to.equal('custom/path.pug');
      done();
    };

    var fsExtraMock = {
      exists: function(path, callback) {
        return callback(true);
      }
    };
    mockery.registerMock('fs-extra', fsExtraMock);
    middleware = this.helpers.requireBackend('webserver/middleware/templates');
    middleware.alterViewsFolder(req, {}, next);
  });

  it('should return unchange req if pug template does not exist', function(done) {
    var next = function() {
      expect(req.params[0]).to.equal('path.pug');
      done();
    };

    process.env.ESN_CUSTOM_TEMPLATES_FOLDER = '/customtests';

    var fsExtraMock = {
      exists: function(path, callback) {
        return callback(false);
      }
    };
    mockery.registerMock('fs-extra', fsExtraMock);

    middleware = this.helpers.requireBackend('webserver/middleware/templates');
    middleware.alterViewsFolder(req, {}, next);
  });

  it('should change req.params[0] if pug template exists', function(done) {
    var next = function() {
      expect(req.params[0]).to.equal('/custom/path.pug');
      done();
    };

    process.env.ESN_CUSTOM_TEMPLATES_FOLDER = '/custom';

    var fsExtraMock = {
      exists: function(path, callback) {
        return callback(true);
      }
    };
    mockery.registerMock('fs-extra', fsExtraMock);

    middleware = this.helpers.requireBackend('webserver/middleware/templates');
    middleware.alterViewsFolder(req, {}, next);
  });

  it('should replace .html by .pug for the pug template', function(done) {
    var pathToTest = '';

    var next = function() {
      expect(pathToTest.indexOf('.html')).to.equal(-1);
      expect(pathToTest.indexOf('.pug')).to.be.greaterThan(0);
      done();
    };

    process.env.ESN_CUSTOM_TEMPLATES_FOLDER = '/customtests';

    req = {
      params: [
        'path.html'
      ]
    };

    var fsExtraMock = {
      exists: function(path, callback) {
        pathToTest = path;
        return callback(false);
      }
    };
    mockery.registerMock('fs-extra', fsExtraMock);

    middleware = this.helpers.requireBackend('webserver/middleware/templates');
    middleware.alterViewsFolder(req, {}, next);
  });

  it('should concatenate .pug to seek the pug template', function(done) {
    var pathToTest = '';

    var next = function() {
      expect(pathToTest.indexOf('.pug')).to.be.greaterThan(0);
      done();
    };

    process.env.ESN_CUSTOM_TEMPLATES_FOLDER = '/customtests';

    var fsExtraMock = {
      exists: function(path, callback) {
        pathToTest = path;
        return callback(false);
      }
    };
    mockery.registerMock('fs-extra', fsExtraMock);

    middleware = this.helpers.requireBackend('webserver/middleware/templates');
    middleware.alterViewsFolder(req, {}, next);
  });
});
