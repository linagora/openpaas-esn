const mockery = require('mockery');
const expect = require('chai').expect;
const sinon = require('sinon');

describe('The files controller', function() {
  let esnConfigMock, getConfigStub;

  beforeEach(function() {
    getConfigStub = sinon.stub().returns(Promise.resolve());
    esnConfigMock = sinon.stub().returns({ get: getConfigStub });
    mockery.registerMock('../../core/esn-config', esnConfigMock);
  });

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
      var res = this.helpers.express.jsonResponse(
        function(code, json) {
          expect(code).to.equal(400);
          expect(json.error.message).to.equal('Bad Parameter');
          done();
        }
      );
      var files = this.helpers.requireBackend('webserver/controllers/files');
      files.create(req, res);
    });

    it('should send 400 if the size param is not an integer', function(done) {
      mockery.registerMock('../../core/filestore', mockNoStore(done));
      var req = { query: { name: 'filename', mimetype: 'text/plain', size: 'large' }, body: 'yeah' };
      var res = this.helpers.express.jsonResponse(
        function(code, json) {
          expect(code).to.equal(400);
          expect(json.error.message).to.equal('Bad Parameter');
          done();
        }
      );
      var files = this.helpers.requireBackend('webserver/controllers/files');
      files.create(req, res);
    });

    it('should send 201 on successful file storage', function(done) {
      var storeId = null;
      var req = {
        query: { name: 'filename', mimetype: 'text/plain', size: 4 },
        body: 'yeah',
        headers: {
          'content-type': 'text/plain'
        },
        on: function() { }
      };
      var res = this.helpers.express.jsonResponse(
        function(code, json) {
          expect(code).to.equal(201);
          expect(json).to.be.an('object');
          expect(json._id).to.equal(storeId);
          done();
        }
      );

      mockery.registerMock('../../core/filestore', {
        store: function(id, contentType, metadata, stream, options, callback) {
          expect(id).to.not.be.null;
          expect(contentType).to.equal(req.query.mimetype);
          expect(metadata).to.be.an('object');
          expect(options.filename).to.equal(req.query.name);
          expect(req).to.equal(stream);
          storeId = id;
          callback(null, { length: stream.body.length });
        }
      });

      var files = this.helpers.requireBackend('webserver/controllers/files');
      files.create(req, res);
    });

    it('should send 201 even without a name attribute', function(done) {
      var storeId = null;
      var req = {
        query: { mimetype: 'text/plain', size: 4 },
        body: 'yeah',
        headers: {
          'content-type': 'text/plain'
        },
        on: function() { }
      };
      var res = this.helpers.express.jsonResponse(
        function(code, detail) {
          expect(code).to.equal(201);
          expect(detail).to.be.an('object');
          expect(detail._id).to.equal(storeId);
          done();
        }
      );

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

      var files = this.helpers.requireBackend('webserver/controllers/files');
      files.create(req, res);
    });

    it('should send 412 and delete file on size mismatch', function(done) {
      var deleteCalled = false;
      var req = {
        query: { name: 'filename', mimetype: 'text/plain', size: 4 },
        body: 'yeah',
        headers: {
          'content-type': 'text/plain'
        },
        on: function() { }
      };
      var res = this.helpers.express.jsonResponse(
        function(code, detail) {
          expect(deleteCalled).to.be.true;
          expect(code).to.equal(412);
          expect(detail).to.be.an('object');
          expect(detail).to.not.have.ownProperty('_id');
          expect(detail.error).to.exist;
          expect(detail.error.message).to.equal('File size mismatch');
          done();
        }
      );

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

      var files = this.helpers.requireBackend('webserver/controllers/files');
      files.create(req, res);
    });

    it('should send 500 on failing file storage', function(done) {
      var req = {
        query: { name: 'filename', mimetype: 'text/plain', size: 2 },
        body: 'yeah',
        headers: {
          'content-type': 'text/plain'
        },
        on: function() { }
      };
      var res = this.helpers.express.jsonResponse(
        function(code, detail) {
          expect(code).to.equal(500);
          expect(detail).to.be.an('object');
          expect(detail).to.not.have.ownProperty('_id');
          expect(detail.error).to.exist;
          expect(detail.error.details).to.be.equal('fooled by a test');
          done();
        }
      );

      mockery.registerMock('../../core/filestore', {
        store: function(id, contentType, metadata, stream, options, callback) {
          expect(id).not.to.be.null;

          expect(metadata).to.be.an('object');
          expect(contentType).to.equal(req.query.mimetype);
          expect(req).to.equal(stream);
          callback(new Error('fooled by a test'), null);
        }
      });

      var files = this.helpers.requireBackend('webserver/controllers/files');
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
        on: function() { }
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
      var files = this.helpers.requireBackend('webserver/controllers/files');
      files.create(req, res);
    });

    describe('On multipart/form-data content-type', function() {
      beforeEach(function() {

      });

      it('should use the specified limit if limit is specified in configuration', function(done) {
        class Busboy {
          /*eslint class-methods-use-this: ["error", { "exceptMethods": ["once", "on"] }] */
          constructor(options) {
            this.options = options;
          }
          once() {}
          on() {}
        }

        const BusboyStub = sinon.spy(() => sinon.createStubInstance(Busboy));
        const limit = 1000;
        const headers = { 'content-type': 'multipart/form-data' };
        const req = {
          query: { name: 'filename', mimetype: 'text/plain', size: 2 },
          body: 'yeah',
          user: { _id: 123 },
          headers,
          on: function() { },
          pipe: busboy => {
            expect(BusboyStub).to.have.been.calledWith({ headers, limits: { fileSize: limit } });
            expect(busboy.on).to.have.been.calledWith('finish', sinon.match.func);
            expect(busboy.on).to.have.been.calledWith('filesLimit', sinon.match.func);
            expect(busboy.once).to.have.been.calledWith('file', sinon.match.func);
            done();
          }
        };

        mockery.registerMock('busboy', BusboyStub);
        getConfigStub.returns(Promise.resolve(limit));
        mockery.registerMock('../../core/filestore', {});

        const files = this.helpers.requireBackend('webserver/controllers/files');

        files.create(req, {});
      });

      it('should use Infinity limit if limit is not specified in configuration', function(done) {
        class Busboy {
          /*eslint class-methods-use-this: ["error", { "exceptMethods": ["once", "on"] }] */
          constructor(options) {
            this.options = options;
          }
          once() {}
          on() {}
        }

        const BusboyStub = sinon.spy(() => sinon.createStubInstance(Busboy));
        const headers = { 'content-type': 'multipart/form-data' };
        const req = {
          query: { name: 'filename', mimetype: 'text/plain', size: 2 },
          body: 'yeah',
          user: { _id: 123 },
          headers,
          on: function() { },
          pipe: busboy => {
            expect(BusboyStub).to.have.been.calledWith({ headers, limits: { fileSize: Infinity } });
            expect(busboy.on).to.have.been.calledWith('finish', sinon.match.func);
            expect(busboy.on).to.have.been.calledWith('filesLimit', sinon.match.func);
            expect(busboy.once).to.have.been.calledWith('file', sinon.match.func);
            done();
          }
        };

        mockery.registerMock('busboy', BusboyStub);
        getConfigStub.returns(Promise.resolve());
        mockery.registerMock('../../core/filestore', {});

        const files = this.helpers.requireBackend('webserver/controllers/files');

        files.create(req, {});
      });

      it('should use Infinity limit if configuration rejects', function(done) {
        class Busboy {
          /*eslint class-methods-use-this: ["error", { "exceptMethods": ["once", "on"] }] */
          constructor(options) {
            this.options = options;
          }
          once() {}
          on() {}
        }

        const BusboyStub = sinon.spy(() => sinon.createStubInstance(Busboy));
        const headers = { 'content-type': 'multipart/form-data' };
        const req = {
          query: { name: 'filename', mimetype: 'text/plain', size: 2 },
          body: 'yeah',
          user: { _id: 123 },
          headers,
          on: function() { },
          pipe: busboy => {
            expect(BusboyStub).to.have.been.calledWith({ headers, limits: { fileSize: Infinity } });
            expect(busboy.on).to.have.been.calledWith('finish', sinon.match.func);
            expect(busboy.on).to.have.been.calledWith('filesLimit', sinon.match.func);
            expect(busboy.once).to.have.been.calledWith('file', sinon.match.func);
            done();
          }
        };

        mockery.registerMock('busboy', BusboyStub);
        getConfigStub.returns(Promise.reject(new Error('I failed')));
        mockery.registerMock('../../core/filestore', {});

        const files = this.helpers.requireBackend('webserver/controllers/files');

        files.create(req, {});
      });
    });
  });

  describe('The get function', function() {
    it('should return 503 if the filestore fails', function(done) {
      var req = { params: { id: '123' } };
      var res = this.helpers.express.jsonResponse(
        function(code, json) {
          expect(code).to.equal(503);
          expect(json).to.be.an('object');
          expect(json.error.code).to.equal(503);
          done();
        }
      );

      mockery.registerMock('../../core/filestore', {
        get: function(id, callback) {
          expect(id).to.equal(req.params.id);
          callback(new Error('fooled by a test'), null, null);
        }
      });

      var files = this.helpers.requireBackend('webserver/controllers/files');
      files.get(req, res);
    });

    it('should return 400 if the id parameter is missing', function(done) {
      var req = { params: {} };
      var res = this.helpers.express.jsonResponse(
        function(code, json) {
          expect(code).to.equal(400);
          expect(json).to.be.an('object');
          expect(json.error.code).to.equal(400);
          done();
        }
      );
      var files = this.helpers.requireBackend('webserver/controllers/files');
      files.get(req, res);
    });

    it('should return 404 if the file is not found', function(done) {
      var req = { params: { id: '123' }, accepts: function() { return false; } };
      var res = this.helpers.express.jsonResponse(
        function(code, json) {
          expect(code).to.equal(404);
          expect(json).to.be.an('object');
          expect(json.error.code).to.equal(404);
          expect(json.error.message).to.equal('Not Found');
          done();
        }
      );

      mockery.registerMock('../../core/filestore', {
        get: function(id, callback) {
          expect(id).to.equal(req.params.id);
          callback(null, null, null);
        }
      });

      var files = this.helpers.requireBackend('webserver/controllers/files');
      files.get(req, res);
    });

    it('should redirect to the 404 page if the file is not found and request accepts html', function(done) {
      var req = {
        params: { id: '123' },
        accepts: function(type) {
          return type === 'html';
        }
      };
      var res = {
        render: function(page) {
          expect(page).to.equal('commons/404');
          done();
        },
        status: function(code) {
          expect(code).to.equal(404);

          return {
            end: function() { }
          };
        }
      };

      mockery.registerMock('../../core/filestore', {
        get: function(id, callback) {
          expect(id).to.equal(req.params.id);
          callback(null, null, null);
        }
      });

      var files = this.helpers.requireBackend('webserver/controllers/files');
      files.get(req, res);
    });

    it('should send the request even if there is no metadata', function(done) {
      var req = { params: { id: '123' } };
      var res = {
        type: function() {
          done(new Error('No content type should be set without metadata'));
        },
        set: function() {
          done(new Error('No headers should be set without metadata'));
        },
        status: function(code) {
          expect(code).to.equal(200);
        }
      };

      mockery.registerMock('../../core/filestore', {
        get: function(id, callback) {
          expect(id).to.equal(req.params.id);
          callback(null, null, {
            pipe: function() {
              done();
            }
          });
        }
      });

      var files = this.helpers.requireBackend('webserver/controllers/files');
      files.get(req, res);
    });

    it('should send the file name if it exists', function(done) {
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
              pipe: function() {
                done();
              }
            });
        }
      });

      var files = this.helpers.requireBackend('webserver/controllers/files');
      files.get(req, res);
    });

    it('should return 304 if the file was not modified', function(done) {
      var modified = new Date();
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
        status: function(code) {
          expect(code).to.equal(304);

          return {
            end: done
          };
        }
      };

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

      var files = this.helpers.requireBackend('webserver/controllers/files');
      files.get(req, res);
    });

    it('should return 500 if the set header throw a error', function(done) {
      var error = new Error('Error');

      var jsonMock = sinon.spy(function() {
        expect(jsonMock).to.have.been.calledWith({
          error: {
            code: 500,
            message: 'Server error',
            details: error.message
          }
        });

        done();
      });

      var req = {
        params: { id: '123' },
        get: sinon.spy()
      };

      var res = {
        set: function() {
          throw error;
        },
        type: sinon.spy(),
        status: function(code) {
          expect(req.get).to.have.been.calledWith('If-Modified-Since');
          expect(code).to.equal(500);

          return {
            json: jsonMock
          };
        }
      };

      mockery.registerMock('../../core/filestore', {
        get: function(id, callback) {
          expect(id).to.equal(req.params.id);
          callback(null, {
            contentType: 'text/plain',
            metadata: {
              name: 'fred "The Great"'
            },
            uploadDate: new Date()
          }, {});
        }
      });

      var files = this.helpers.requireBackend('webserver/controllers/files');
      files.get(req, res);
    });

    it('should set header with no special character', function(done) {
      var req = {
        params: { id: '123' },
        get: sinon.spy()
      };

      var res = {
        set: sinon.spy(),
        type: sinon.spy(),
        status: function(code) {
          expect(req.get).to.have.been.calledWith('If-Modified-Since');
          expect(res.type).to.have.been.calledWith('text/plain');
          expect(res.set.secondCall).to.have.been.calledWith('Content-Disposition', 'inline; filename="aFilename"');
          expect(code).to.equal(200);
        }
      };

      mockery.registerMock('../../core/filestore', {
        get: function(id, callback) {
          expect(id).to.equal(req.params.id);
          callback(null, {
            contentType: 'text/plain',
            filename: 'a–"Filename"',
            metadata: {
              name: 'fred "TheGreat"'
            },
            uploadDate: new Date()
          }, {
            pipe: function() {
              done();
            }
          });
        }
      });

      var files = this.helpers.requireBackend('webserver/controllers/files');
      files.get(req, res);
    });

  });
});
