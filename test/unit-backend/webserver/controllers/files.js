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
        store: function(id, contentType, metadata, stream, options, callback) {
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
        body: 'yeah',
        headers: {
          'content-type': 'text/plain'
        },
        on: function() {}
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
        store: function(id, contentType, metadata, stream, options, callback) {
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
        body: 'yeah',
        headers: {
          'content-type': 'text/plain'
        },
        on: function() {}
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
        store: function(id, contentType, metadata, stream, options, callback) {
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
        body: 'yeah',
        headers: {
          'content-type': 'text/plain'
        },
        on: function() {}
      };
      var res = {
        json: function(code, detail) {
          expect(deleteCalled).to.be.true;
          expect(code).to.equal(412);
          expect(detail).to.be.an('object');
          expect(detail).to.not.have.ownProperty('_id');
          expect(detail.error).to.exist;
          expect(detail.error.message).to.equal('File size mismatch');
          done();
        }
      };
      var files = require(this.testEnv.basePath + '/backend/webserver/controllers/files');
      files.create(req, res);
    });

    it('should send 500 on failing file storage', function(done) {
      var storeId = null;
      mockery.registerMock('../../core/filestore', {
        store: function(id, contentType, metadata, stream, options, callback) {
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
        body: 'yeah',
        headers: {
          'content-type': 'text/plain'
        },
        on: function() {}
      };
      var res = {
        json: function(code, detail) {
          expect(code).to.equal(500);
          expect(detail).to.be.an('object');
          expect(detail).to.not.have.ownProperty('_id');
          expect(detail.error).to.exist;
          expect(detail.error.details).to.be.equal('fooled by a test');
          done();
        }
      };
      var files = require(this.testEnv.basePath + '/backend/webserver/controllers/files');
      files.create(req, res);
    });

    it('should save the current user as creator', function(done) {
      var req = {
        query: { name: 'filename', mimetype: 'text/plain', size: 2 },
        body: 'yeah',
        user: { _id: 123 },
        headers: {
          'content-type': 'text/plain'
        },
        on: function() {}
      };

      mockery.registerMock('../../core/filestore', {
        store: function(id, contentType, metadata) {
          expect(id).not.to.be.null;
          expect(metadata).to.be.an('object');
          expect(metadata.creator).to.exist;
          expect(metadata.creator.objectType).to.equal('user');
          expect(metadata.creator.id).to.equal(req.user._id);
          return done();
        }
      });


      var res = {
        json: function() {
          return done(new Error());
        }
      };
      var files = require(this.testEnv.basePath + '/backend/webserver/controllers/files');
      files.create(req, res);
    });
  });

  describe('The get function', function() {
    it('should return 503 if the filestore fails', function(done) {
      mockery.registerMock('../../core/filestore', {
        get: function(id, callback) {
          expect(id).to.equal(req.params.id);
          callback(new Error('fooled by a test'), null, null);
        }
      });

      var req = { params: { id: '123' } };
      var res = {
        json: function(code, detail) {
            expect(code).to.equal(503);
            expect(detail).to.be.an('object');
            expect(detail.error).to.equal(503);
            done();
        }
      };
      var files = require(this.testEnv.basePath + '/backend/webserver/controllers/files');
      files.get(req, res);
    });

    it('should return 400 if the id parameter is missing', function(done) {
      var req = { params: {} };
      var res = {
        json: function(code, detail) {
            expect(code).to.equal(400);
            expect(detail).to.be.an('object');
            expect(detail.error).to.equal(400);
            done();
        }
      };
      var files = require(this.testEnv.basePath + '/backend/webserver/controllers/files');
      files.get(req, res);
    });

    it('should return 404 if the file is not found', function(done) {
      mockery.registerMock('../../core/filestore', {
        get: function(id, callback) {
          expect(id).to.equal(req.params.id);
          callback(null, null, null);
        }
      });

      var req = { params: { id: '123' } };
      var res = {
        json: function(code, detail) {
            expect(code).to.equal(404);
            expect(detail).to.be.an('object');
            expect(detail.error).to.equal(404);
            expect(detail.message).to.equal('Not Found');
            done();
        }
      };
      var files = require(this.testEnv.basePath + '/backend/webserver/controllers/files');
      files.get(req, res);
    });

    it('should send the request even if there is no metadata', function(done) {
      mockery.registerMock('../../core/filestore', {
        get: function(id, callback) {
          expect(id).to.equal(req.params.id);
          callback(null, null, {
            pipe: function(res) {
              done();
            }
          });
        }
      });

      var req = { params: { id: '123' } };
      var res = {
        type: function(ctype) {
          done(new Error('No content type should be set without metadata'));
        },
        set: function(hdr, val) {
          done(new Error('No headers should be set without metadata'));
        },
        status: function(code) {
          expect(code).to.equal(200);
        }
      };
      var files = require(this.testEnv.basePath + '/backend/webserver/controllers/files');
      files.get(req, res);
    });

    it('should send the file name if it exists', function(done) {
      mockery.registerMock('../../core/filestore', {
        get: function(id, callback) {
          expect(id).to.equal(req.params.id);
          callback(null, {
            contentType: 'text/plain',
            metadata: {
              name: 'fred "The Great"'
            },
            uploadDate: new Date()
          }, {
            pipe: function(res) {
              done();
            }
          });
        }
      });

      var req = {
        params: { id: '123' },
        get: function(hdr) {
            expect(hdr).to.equal('If-Modified-Since');
            return null;
        }
      };
      var res = {
        type: function(ctype) {
          expect(ctype).to.equal('text/plain');
        },
        set: function(hdr, val) {
          if (hdr === 'Content-Disposition') {
            expect(val).to.equal('inline; filename="fred The Great"');
          }
        },
        status: function(code) {
          expect(code).to.equal(200);
        }
      };
      var files = require(this.testEnv.basePath + '/backend/webserver/controllers/files');
      files.get(req, res);
    });

    it('should return 304 if the file was not modified', function(done) {
      var modified = new Date();
      mockery.registerMock('../../core/filestore', {
        get: function(id, callback) {
          expect(id).to.equal(req.params.id);
          callback(null, {
            contentType: 'text/plain',
            metadata: {},
            uploadDate: modified
          }, {});
        }
      });

      var req = {
        params: { id: '123' },
        get: function(hdr) {
            expect(hdr).to.equal('If-Modified-Since');
            return modified.toString();
        }
      };
      var res = {
        type: function(ctype) {
            expect(ctype).to.equal('text/plain');
        },
        send: function(code) {
            expect(code).to.equal(304);
            done();
        }
      };
      var files = require(this.testEnv.basePath + '/backend/webserver/controllers/files');
      files.get(req, res);
    });
  });
});
