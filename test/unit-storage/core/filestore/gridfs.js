'use strict';

var expect = require('chai').expect;
var uuid = require('node-uuid');
var path = require('path');
var hash_file = require('hash_file');

describe('The filestore gridfs module', function() {

  var creator = {objectType: 'user', id: 123};

  before(function() {
    this.testEnv.writeDBConfigFile();
  });

  beforeEach(function(done) {
    this.mongoose = require('mongoose');
    this.conn = this.mongoose.connect(this.testEnv.mongoUrl);
    this.mongoose.connection.on('open', function() {
      // ensure that the connection is open before using the file store
      done();
    });
  });

  afterEach(function(done) {
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });

  after(function() {
    this.testEnv.removeDBConfigFile();
  });

  it('should fail if metadata is not defined', function(done) {
    var filestore = require(this.testEnv.basePath + '/backend/core/filestore/gridfs');
    var file = path.resolve(this.testEnv.fixtures + '/README.md');

    hash_file(file, 'md5', function(err, hash) {
      if (err) {
        return done(err);
      }
      var stream = require('fs').createReadStream(file);

      var id = uuid.v4();
      var type = 'application/text';
      filestore.store(id, type, null, stream, function(err, data) {
        expect(err).to.exist;
        done();
      });
    });
  });

  it('should fail if metadata.creator is not defined', function(done) {
    var filestore = require(this.testEnv.basePath + '/backend/core/filestore/gridfs');
    var file = path.resolve(this.testEnv.fixtures + '/README.md');

    hash_file(file, 'md5', function(err, hash) {
      if (err) {
        return done(err);
      }
      var stream = require('fs').createReadStream(file);

      var id = uuid.v4();
      var type = 'application/text';
      filestore.store(id, type, {}, stream, function(err, data) {
        expect(err).to.exist;
        done();
      });
    });
  });

  it('should store the file without error', function(done) {
    var filestore = require(this.testEnv.basePath + '/backend/core/filestore/gridfs');
    var file = path.resolve(this.testEnv.fixtures + '/README.md');
    var stream = require('fs').createReadStream(file);

    var id = uuid.v4();
    filestore.store(id, 'application/text', {creator: creator}, stream, function(err, data) {
      expect(err).to.not.exist;
      expect(data).to.exist;
      done();
    });
  });

  it('should store the file and return valid values', function(done) {
    var filestore = require(this.testEnv.basePath + '/backend/core/filestore/gridfs');
    var file = path.resolve(this.testEnv.fixtures + '/README.md');

    hash_file(file, 'md5', function(err, hash) {
      if (err) {
        return done(err);
      }
      var stream = require('fs').createReadStream(file);

      var id = uuid.v4();
      var type = 'application/text';
      filestore.store(id, type, {creator: creator}, stream, function(err, data) {
        expect(err).to.not.exist;
        expect(data).to.exist;
        expect(data.md5).to.equal(hash);
        expect(data.filename).to.equal(id);
        expect(data.contentType).to.equal(type);
        done();
      });
    });
  });

  it('should fail to store when input stream is not set', function(done) {
    var filestore = require(this.testEnv.basePath + '/backend/core/filestore/gridfs');
    var id = uuid.v4();
    filestore.store(id, 'application/text', {creator: creator}, null, function(err, data) {
      expect(err).to.exist;
      done();
    });
  });

  it('should fail to store when input id is not set', function(done) {
    var filestore = require(this.testEnv.basePath + '/backend/core/filestore/gridfs');
    filestore.store(null, 'application/text', {creator: creator}, null, function(err, data) {
      expect(err).to.exist;
      done();
    });
  });

  // META

  it('should fail to get meta when input id is not set', function(done) {
    var filestore = require(this.testEnv.basePath + '/backend/core/filestore/gridfs');
    filestore.getMeta(null, function(err, data) {
      expect(err).to.exist;
      expect(data).to.not.exist;
      done();
    });
  });

  it('should return valid metadata', function(done) {
    var filestore = require(this.testEnv.basePath + '/backend/core/filestore/gridfs');
    var file = path.resolve(this.testEnv.fixtures + '/README.md');
    var stream = require('fs').createReadStream(file);
    var userMeta = {
      foo: 'bar',
      bar: 'baz',
      qix: {
        string: 'value1',
        int: 1,
        boolean: true
      },
      creator: creator
    };

    var id = uuid.v4();
    filestore.store(id, 'application/text', userMeta, stream, function(err, data) {
      if (err) {
        return done(err);
      }

      filestore.getMeta(id, function(err, data) {
        expect(err).to.not.exist;
        expect(data).to.exist;
        expect(data.metadata).to.deep.equal(userMeta);
        done();
      });
    });
  });

  it('should return null when trying to get metadata from unknown file', function(done) {
    var filestore = require(this.testEnv.basePath + '/backend/core/filestore/gridfs');
    filestore.getMeta('123', function(err, data) {
      expect(err).to.not.exist;
      expect(data).to.not.exist;
      done();
    });
  });

  // DELETE
  it('should fail to delete when input id is not set', function(done) {
    var filestore = require(this.testEnv.basePath + '/backend/core/filestore/gridfs');
    filestore.delete(null, function(err, data) {
      expect(err).to.exist;
      done();
    });
  });

  it('should send back null when trying to get delete from an unknown id', function(done) {
    var filestore = require(this.testEnv.basePath + '/backend/core/filestore/gridfs');
    filestore.delete('123', function(err) {
      expect(err).to.not.exist;
      done();
    });
  });

  it('should delete a file from its id', function(done) {
    var filestore = require(this.testEnv.basePath + '/backend/core/filestore/gridfs');
    var file = path.resolve(this.testEnv.fixtures + '/README.md');
    var stream = require('fs').createReadStream(file);

    var id = uuid.v4();
    filestore.store(id, 'application/text', {creator: creator}, stream, function(err, data) {
      if (err) {
        return done(err);
      }

      filestore.delete(id, function(err) {
        expect(err).to.not.exist;

        filestore.get(id, function(err, meta, stream) {
          expect(err).to.not.exist;
          expect(meta).to.not.exist;
          expect(stream).to.not.exist;
          done();
        });
      });
    });
  });

  // GET
  it('should send back an error when trying to get a file from a null id', function(done) {
    var filestore = require(this.testEnv.basePath + '/backend/core/filestore/gridfs');
    filestore.get(null, function(err, meta, stream) {
      expect(err).to.exist;
      done();
    });
  });

  it('should send back the file from its id', function(done) {
    var filestore = require(this.testEnv.basePath + '/backend/core/filestore/gridfs');
    var file = path.resolve(this.testEnv.fixtures + '/README.md');
    var stream = require('fs').createReadStream(file);

    var id = uuid.v4();
    filestore.store(id, 'application/text', {creator: creator}, stream, function(err, data) {
      if (err) {
        return done(err);
      }

      filestore.get(id, function(err, data, stream) {
        var calls = 0;
        expect(err).to.not.exist;
        expect(data).to.exist;
        stream.pipe(process.stdout);
        stream.on('data', function() {
          calls++;
        });
        stream.on('error', function(err) {
          console.log('err', err);
          done(err);
        });
        stream.on('end', function() {
          expect(calls).to.be.above(0);
          done();
        });
      });
    });
  });

  it('should return a valid content', function(done) {
    var filestore = require(this.testEnv.basePath + '/backend/core/filestore/gridfs');
    var file = path.resolve(this.testEnv.fixtures + '/README.md');
    var fs = require('fs');
    var stream = fs.createReadStream(file);
    var out = this.testEnv.tmp + '/' + uuid.v4();
    var outstream = fs.createWriteStream(out);

    var id = uuid.v4();
    filestore.store(id, 'application/text', {creator: creator}, stream, function(err, data) {
      if (err) {
        return done(err);
      }

      filestore.get(id, function(err, data, stream) {
        expect(err).to.not.exist;
        expect(data).to.exist;

        stream.pipe(outstream);
        stream.on('error', function(err) {
          done(err);
        });
        stream.on('end', function() {

          hash_file(out, 'md5', function(err, hash1) {
            if (err) {
              return done(err);
            }

            hash_file(file, 'md5', function(err, hash2) {
              if (err) {
                return done(err);
              }
              expect(hash1).to.equal(hash2);
              done();
            });
          });
        });
      });
    });
  });

  // getFileStream
  it('should send back an error when trying to get a file from a null id', function(done) {
    var filestore = require(this.testEnv.basePath + '/backend/core/filestore/gridfs');
    filestore.getFileStream(null, function(err, meta, stream) {
      expect(err).to.exist;
      done();
    });
  });

  it('should send back error if the file does not exist', function(done) {
    var filestore = require(this.testEnv.basePath + '/backend/core/filestore/gridfs');
    filestore.getFileStream('123', function(err, meta, stream) {
      expect(err).to.exist;
      done();
    });
  });

  it('should send back the stream when the file exists', function(done) {
    var filestore = require(this.testEnv.basePath + '/backend/core/filestore/gridfs');
    var file = path.resolve(this.testEnv.fixtures + '/README.md');
    var fs = require('fs');
    var stream = fs.createReadStream(file);
    var out = this.testEnv.tmp + '/' + uuid.v4();
    var outstream = fs.createWriteStream(out);

    var id = uuid.v4();
    filestore.store(id, 'application/text', {creator: creator}, stream, function(err, data) {
      if (err) {
        return done(err);
      }

      filestore.getFileStream(id, function(err, stream) {
        expect(err).to.not.exist;
        expect(stream).to.exist;

        stream.pipe(outstream);
        stream.on('error', function(err) {
          done(err);
        });
        stream.on('end', function() {

          hash_file(out, 'md5', function(err, hash1) {
            if (err) {
              return done(err);
            }

            hash_file(file, 'md5', function(err, hash2) {
              if (err) {
                return done(err);
              }
              expect(hash1).to.equal(hash2);
              done();
            });
          });
        });
      });
    });
  });

  // getAsFileStoreMeta

  it('should return {} on undefined input', function(done) {
    var filestore = require(this.testEnv.basePath + '/backend/core/filestore/gridfs');
    expect(filestore.getAsFileStoreMeta()).to.be.empty;
    done();
  });

  it('should return a hash on empty input', function(done) {
    var filestore = require(this.testEnv.basePath + '/backend/core/filestore/gridfs');
    expect(filestore.getAsFileStoreMeta({})).to.exist;
    done();
  });

  it('should return a valid hash', function(done) {
    var filestore = require(this.testEnv.basePath + '/backend/core/filestore/gridfs');
    var meta = {
      id: '534cee93a56a09ae8bcac4cb',
      filename: 'd946c3cc-00ec-440f-b984-01ef165a263e',
      contentType: 'application/text',
      length: 61,
      chunkSize: 1024,
      uploadDate: 'Tue Apr 15 2014 10:32:19 GMT+0200 (CEST)',
      aliases: null,
      metadata: {
        filename: 'README.md',
        foo: 'bar',
        bar: 'baz'
      },
      md5: 'ab33e0dd1b82dd06cb8c8172c3df8b21'
    };

    var out = filestore.getAsFileStoreMeta(meta);
    expect(out).to.exist;
    expect(out.id).to.equal(meta.filename);
    expect(out.contentType).to.equal(meta.contentType);
    expect(out.length).to.equal(meta.length);
    expect(out.metadata).to.deep.equal(meta.metadata);
    expect(out.md5).to.equal(meta.md5);
    done();
  });

});
