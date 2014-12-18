'use strict';

var mockery = require('mockery');
var createReadStream = require('fs').createReadStream;
var createWriteStream = require('fs').createWriteStream;

var expect = require('chai').expect;

describe('The core image module', function() {

  afterEach(function() {
    try {
      require('fs').unlinkSync(this.testEnv.tmp + '/img.jpg');
    } catch (e) {}
  });

  describe('getSize method', function() {
    it('should return the size of the image and the gmInstance', function(done) {
      var core = require(this.testEnv.basePath + '/backend/core'),
          image = core.image;
      var rs = createReadStream(this.testEnv.fixtures + '/images/not_square.jpg');
      image.getSize(rs, function(err, size, gmInstance) {
        expect(size.width).to.equal(500);
        expect(size.height).to.equal(400);
        expect(gmInstance).to.exit;
        expect(gmInstance.sourceBuffer).to.be.a.Buffer;
        done();
      });
    });
  });

  describe('checkImageSquare method', function() {
    it('should return an error when the image is not a square', function(done) {
      var core = require(this.testEnv.basePath + '/backend/core'),
          image = core.image;
      var rs = createReadStream(this.testEnv.fixtures + '/images/not_square.jpg');
      image.checkImageSquare(rs, function(err, size, gmInstance) {
        expect(err).to.exist;
        expect(err.code).to.equal(2);
        expect(err.message).to.equal('Image is not a square');
        done();
      });
    });

    it('should return image size and gmInstance when the image is a square', function(done) {
      var core = require(this.testEnv.basePath + '/backend/core'),
          image = core.image;
      var rs = createReadStream(this.testEnv.fixtures + '/images/square.jpg');
      image.checkImageSquare(rs, function(err, size, gmInstance) {
        expect(err).to.be.null;
        expect(size).to.exist;
        expect(size.width).to.equal(306);
        expect(size.height).to.equal(306);
        expect(gmInstance).to.exit;
        expect(gmInstance.sourceBuffer).to.be.a.Buffer;
        done();
      });
    });
  });

  describe('recordAvatar method', function() {
    var tmpdir, called;

    beforeEach(function() {
      tmpdir = this.testEnv.tmp;
      called = 0;
    });

    it('should return an error if the image is not a square', function(done) {
      var filestoreMock = {
        store: function(id, contentType, opts, readableStream, options, callback) {
          var ws = createWriteStream(tmpdir + '/img.jpg');
          readableStream.pipe(ws);
          return callback(null, { length: 42 });
        },
        'delete': function(id, callback) {
          return callback(null);
        },
        getAsFileStoreMeta: function(file) {
          return { length: file.length };
        }
      };

      mockery.registerMock('../filestore', filestoreMock);
      var core = require(this.testEnv.basePath + '/backend/core'),
          image = core.image;

      var is = createReadStream(this.testEnv.fixtures + '/images/not_square.jpg');
      image.recordAvatar('666', 'image/jpeg', {}, is, function(err, size) {
        expect(err).to.be.defined;
        expect(err.code).to.equal(2);
        expect(err.message).to.equal('Image is not a square');
        done();
      });
    });

    it('should call filestore.store and then filestore.delete if the image is not a square', function(done) {
      var filestoreMock = {
        store: function(id, contentType, opts, readableStream, options, callback) {
          var ws = createWriteStream(tmpdir + '/img.jpg');
          readableStream.pipe(ws);
          expect(id).to.equal('666');
          called++;
          return callback(null, { length: 42 });
        },
        'delete': function(id, callback) {
          expect(id).to.equal('666');
          called++;
          expect(called).to.equal(2);
          done();
          return callback(null);
        },
        getAsFileStoreMeta: function(file) {
          return { length: file.length };
        }
      };

      mockery.registerMock('../filestore', filestoreMock);
      var core = require(this.testEnv.basePath + '/backend/core'),
          image = core.image;

      var is = createReadStream(this.testEnv.fixtures + '/images/not_square.jpg');
      image.recordAvatar('666', 'image/jpeg', {}, is, function(err, size) {
      });
    });

    it('should return a gm error if the image is not an image', function(done) {
      var filestoreMock = {
        store: function(id, contentType, opts, readableStream, options, callback) {
          var ws = createWriteStream(tmpdir + '/img.jpg');
          readableStream.pipe(ws);
          return callback(null, { length: 42 });
        },
        'delete': function(id, callback) {
          return callback(null);
        },
        getAsFileStoreMeta: function(file) {
          return { length: file.length };
        }
      };

      mockery.registerMock('../filestore', filestoreMock);
      var core = require(this.testEnv.basePath + '/backend/core'),
          image = core.image;

      var is = createReadStream(this.testEnv.fixtures + '/images/not-an-image.js');
      image.recordAvatar('666', 'image/jpeg', {}, is, function(err, size) {
        expect(err).to.be.defined;
        expect(err.code).to.equal(2);
        expect(err.message).to.match(/format/);
        expect(err.message).to.match(/image/);
        done();
      });
    });

    it('should call filestore.store and then filestore.delete if the image is not an image', function(done) {
      var filestoreMock = {
        store: function(id, contentType, opts, readableStream, options, callback) {
          var ws = createWriteStream(tmpdir + '/img.jpg');
          readableStream.pipe(ws);
          expect(id).to.equal('666');
          called++;
          return callback(null, { length: 42 });
        },
        'delete': function(id, callback) {
          expect(id).to.equal('666');
          called++;
          expect(called).to.equal(2);
          done();
          return callback(null);
        },
        getAsFileStoreMeta: function(file) {
          return { length: file.length };
        }
      };

      mockery.registerMock('../filestore', filestoreMock);
      var core = require(this.testEnv.basePath + '/backend/core'),
          image = core.image;

      var is = createReadStream(this.testEnv.fixtures + '/images/not-an-image.js');
      image.recordAvatar('666', 'image/jpeg', {}, is, function(err, size) {
      });
    });

    it('should call filestore.store twice if the image is correct', function(done) {
      var ObjectId = require('mongoose').Types.ObjectId;
      var avatarId = new ObjectId();
      var filestorestore2 = function(id, contentType, opts, readableStream, callback) {
        expect(opts.avatar).to.be.an('object');
        expect(opts.avatar.originalId + '').to.equal(avatarId + '');
        done();
      };
      var filestoreMock = {
        store: function(id, contentType, opts, readableStream, options, callback) {
          var ws = createWriteStream(tmpdir + '/img.jpg');
          readableStream.pipe(ws);
          expect(id.equals(avatarId)).to.be.true;
          filestoreMock.store = filestorestore2;
          return callback(null, { length: 42 });
        },
        getAsFileStoreMeta: function(file) {
          return { length: file.length };
        }
      };

      mockery.registerMock('../filestore', filestoreMock);
      var core = require(this.testEnv.basePath + '/backend/core'),
          image = core.image;

      var is = createReadStream(this.testEnv.fixtures + '/images/square.jpg');
      image.recordAvatar(avatarId, 'image/jpeg', {}, is, function(err, size) {
      });
    });

  });

  describe('getAvatar() fn', function() {
    describe('when format===original', function() {
      it('should call the filestore with original id', function(done) {
        var id = '123';
        mockery.registerMock('../filestore', {
          get: function(_id, callback) {
            expect(_id).to.exist;
            expect(_id).to.equal(id);
            return callback();
          }
        });

        var module = require(this.testEnv.basePath + '/backend/core/image');
        module.getAvatar(id, 'original', done);
      });
    });
    describe('when format!==original', function() {
      it('should lookup the reduced avatar', function(done) {
        var id = '123';
        mockery.registerMock('../filestore', {
          find: function(query, callback) {
            expect(query['metadata.avatar.originalId']).to.equal('123');
            expect(query['metadata.avatar.fullsize']).to.equal(false);
            done();
          },
          get: function(_id, callback) {
            expect(_id).to.exist;
            expect(_id).to.not.equal(id);
            return callback();
          },
          getMeta: function(id, callback) {
            return callback(null, {});
          },
          getFileStream: function(id, callback) {
            return callback(null, {});
          }
        });

        var module = require(this.testEnv.basePath + '/backend/core/image');
        module.getAvatar(id, null, function() {});
      });

      describe('and reduced avatar cannot be found', function() {
        it('should ask the filestore for the original avatar', function(done) {
          var id = '123';
          mockery.registerMock('../filestore', {
            find: function(query, callback) {
              callback(null, []);
            },
            get: function(_id, callback) {
              expect(_id).to.exist;
              expect(_id).to.equal(id);
              done();
            },
            getMeta: function(id, callback) {
              return callback(null, {});
            },
            getFileStream: function(id, callback) {
              return callback(null, {});
            }
          });

          var module = require(this.testEnv.basePath + '/backend/core/image');
          module.getAvatar(id, null, function() {});
        });
      });
      describe('and reduced avatar is found found', function() {
        it('should ask the filestore for the reduced avatar', function(done) {
          var id = '123';
          mockery.registerMock('../filestore', {
            find: function(query, callback) {
              callback(null, ['reducedId']);
            },
            get: function(_id, callback) {
              expect(_id).to.exist;
              expect(_id).to.equal('reducedId');
              done();
            },
            getMeta: function(id, callback) {
              return callback(null, {});
            },
            getFileStream: function(id, callback) {
              return callback(null, {});
            }
          });

          var module = require(this.testEnv.basePath + '/backend/core/image');
          module.getAvatar(id, null, function() {});
        });
      });
    });
  });

  describe('getSmallAvatar() fn', function() {
    it('should send back error when filestore#find sends back error', function(done) {
      var id = '123';
      mockery.registerMock('../filestore', {
        get: function(_id, callback) {
          return done(new Error());
        },
        find: function(id, callback) {
          return callback(new Error());
        },
        getFileStream: function(id, callback) {
          return done(new Error());
        }
      });
      var module = require(this.testEnv.basePath + '/backend/core/image');
      module.getSmallAvatar(id, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should call the filestore with resized id', function(done) {
      var id = '123';
      mockery.registerMock('../filestore', {
        get: function(_id, callback) {
          expect(_id).to.exist;
          expect(_id).to.equal('resizedId');
          return callback();
        },
        find: function(id, callback) {
          return callback(null, ['resizedId']);
        },
        getFileStream: function(id, callback) {
          return callback(null, {});
        }
      });
      var module = require(this.testEnv.basePath + '/backend/core/image');
      module.getSmallAvatar(id, done);
    });
  });
});
