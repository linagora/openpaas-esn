'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;

describe('The files controller', function() {
  describe('The create function', function() {
    function mockNoStore(done) {
      return {
        store: function() {
          done(new Error('should not have tried to store the file'));
        }
      };
    }

    it('should send 400 if the size param is negative', function(done) {
      mockery.registerMock('../../core/filestore', mockNoStore(done));
      var req = { query: { name: 'filename', mimetype: 'text/plain', size: -1 }, body: 'yeah' };
      var res = {
        json: function(code, detail) {
          expect(code).to.equal(400);
          expect(detail.message).to.equal('Bad Parameter');
          done();
        }
      };
      var files = require(this.testEnv.basePath + '/backend/webserver/controllers/files');
      files.create(req, res);
    });

    it('should send 400 if the size param is not an integer', function(done) {
      mockery.registerMock('../../core/filestore', mockNoStore(done));
      var req = { query: { name: 'filename', mimetype: 'text/plain', size: 'large' }, body: 'yeah' };
      var res = {
        json: function(code, detail) {
          expect(code).to.equal(400);
          expect(detail.message).to.equal('Bad Parameter');
          done();
        }
      };
      var files = require(this.testEnv.basePath + '/backend/webserver/controllers/files');
      files.create(req, res);
    });

    it('should send 201 on successful file storage', function(done) {
      var storeId = null;

      mockery.registerMock('../../core/filestore', {
        store: function(id, contentType, metadata, stream, callback) {
          expect(id).to.not.be.null;
          expect(contentType).to.equal(req.query.mimetype);
          expect(metadata).to.be.an('object');
          expect(metadata.name).to.equal(req.query.name);
          expect(req).to.equal(stream);
          storeId = id;
          callback(null, { length: stream.body.length });
        }
      });

      var req = {
        query: { name: 'filename', mimetype: 'text/plain', size: 4 },
        body: 'yeah'
      };
      var res = {
        json: function(code, detail) {
          expect(code).to.equal(201);
          expect(detail).to.be.an('object');
          expect(detail._id).to.equal(storeId);
          done();
        }
      };
      var files = require(this.testEnv.basePath + '/backend/webserver/controllers/files');
      files.create(req, res);
    });

    it('should send 201 even without a name attribute', function(done) {
      var storeId = null;

      mockery.registerMock('../../core/filestore', {
        store: function(id, contentType, metadata, stream, callback) {
          expect(id).to.not.be.null;
          storeId = id;

          expect(contentType).to.equal(req.query.mimetype);
          expect(metadata).to.be.an('object');
          expect(metadata).to.not.have.ownProperty('name');
          expect(req).to.equal(stream);
          callback(null, { length: stream.body.length });
        }
      });

      var req = {
        query: { mimetype: 'text/plain', size: 4 },
        body: 'yeah'
      };
      var res = {
        json: function(code, detail) {
          expect(code).to.equal(201);
          expect(detail).to.be.an('object');
          expect(detail._id).to.equal(storeId);
          done();
        }
      };
      var files = require(this.testEnv.basePath + '/backend/webserver/controllers/files');
      files.create(req, res);
    });

    it('should send 412 and delete file on size mismatch', function(done) {
      var deleteCalled = false;

      mockery.registerMock('../../core/filestore', {
        store: function(id, contentType, metadata, stream, callback) {
          expect(id).to.not.be.null;
          expect(contentType).to.equal(req.query.mimetype);
          expect(req).to.equal(stream);
          callback(null, { length: 666 });
        },
        delete: function(id, callback) {
          deleteCalled = true;
          callback(null);
        }
      });

      var req = {
        query: { name: 'filename', mimetype: 'text/plain', size: 4 },
        body: 'yeah'
      };
      var res = {
        json: function(code, detail) {
          expect(deleteCalled).to.be.true;
          expect(code).to.equal(412);
          expect(detail).to.be.an('object');
          expect(detail).to.not.have.ownProperty('_id');
          expect(detail.message).to.equal('File size mismatch');
          done();
        }
      };
      var files = require(this.testEnv.basePath + '/backend/webserver/controllers/files');
      files.create(req, res);
    });

    it('should send 500 on failing file storage', function(done) {
      var storeId = null;
      mockery.registerMock('../../core/filestore', {
        store: function(id, contentType, metadata, stream, callback) {
          expect(id).not.to.be.null;
          storeId = id;

          expect(metadata).to.be.an('object');
          expect(metadata.name).to.equal(req.query.name);
          expect(contentType).to.equal(req.query.mimetype);
          expect(req).to.equal(stream);
          callback(new Error('fooled by a test'), null);
        }
      });

      var req = {
        query: { name: 'filename', mimetype: 'text/plain', size: 2 },
        body: 'yeah'
      };
      var res = {
        json: function(code, detail) {
          expect(code).to.equal(500);
          expect(detail).to.be.an('object');
          expect(detail).to.not.have.ownProperty('_id');
          expect(detail.details).to.be.equal('fooled by a test');
          done();
        }
      };
      var files = require(this.testEnv.basePath + '/backend/webserver/controllers/files');
      files.create(req, res);
    });
  });
});
