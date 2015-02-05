'use strict';

var expect = require('chai').expect;
var uuid = require('node-uuid');
var path = require('path');
var hash_file = require('hash_file');
var q = require('q');

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
    this.mongoose.connection.db.dropDatabase(done);
  });

  after(function() {
    this.testEnv.removeDBConfigFile();
  });

  it('should fail if metadata is not defined', function(done) {
    var ObjectId = this.mongoose.Types.ObjectId;
    var filestore = this.helpers.requireBackend('core/filestore/gridfs');
    var file = path.resolve(this.testEnv.fixtures + '/README.md');

    hash_file(file, 'md5', function(err, hash) {
      if (err) {
        return done(err);
      }
      var stream = require('fs').createReadStream(file);

      var id = new ObjectId();
      var type = 'application/text';
      filestore.store(id, type, null, stream, null, function(err, data) {
        expect(err).to.exist;
        done();
      });
    });
  });

  it('should fail if metadata.creator is not defined', function(done) {
    var filestore = this.helpers.requireBackend('core/filestore/gridfs');
    var file = path.resolve(this.testEnv.fixtures + '/README.md');
    var ObjectId = this.mongoose.Types.ObjectId;

    hash_file(file, 'md5', function(err, hash) {
      if (err) {
        return done(err);
      }
      var stream = require('fs').createReadStream(file);

      var id = new ObjectId();
      var type = 'application/text';
      filestore.store(id, type, {}, stream, null, function(err, data) {
        expect(err).to.exist;
        done();
      });
    });
  });

  it('should fail if id is not a valid mongodb ObjectId', function(done) {
    var filestore = this.helpers.requireBackend('core/filestore/gridfs');
    var file = path.resolve(this.testEnv.fixtures + '/README.md');

    hash_file(file, 'md5', function(err, hash) {
      if (err) {
        return done(err);
      }
      var stream = require('fs').createReadStream(file);

      var type = 'application/text';
      filestore.store('id', type, {}, stream, null, function(err, data) {
        expect(err).to.exist;
        done();
      });
    });
  });

  it('should store the file without error', function(done) {
    var ObjectId = this.mongoose.Types.ObjectId;
    var filestore = this.helpers.requireBackend('core/filestore/gridfs');
    var file = path.resolve(this.testEnv.fixtures + '/README.md');
    var stream = require('fs').createReadStream(file);

    var id = new ObjectId();
    filestore.store(id, 'application/text', {creator: creator}, stream, null, function(err, data) {
      expect(err).to.not.exist;
      expect(data).to.exist;
      done();
    });
  });

  it('should store the file and return valid values', function(done) {
    var ObjectId = this.mongoose.Types.ObjectId;
    var filestore = this.helpers.requireBackend('core/filestore/gridfs');
    var file = path.resolve(this.testEnv.fixtures + '/README.md');

    hash_file(file, 'md5', function(err, hash) {
      if (err) {
        return done(err);
      }
      var stream = require('fs').createReadStream(file);

      var id = new ObjectId();
      var type = 'application/text';
      filestore.store(id, type, {creator: creator}, stream, {filename: 'test.md'}, function(err, data) {
        expect(err).to.not.exist;
        expect(data).to.exist;
        expect(data.md5).to.equal(hash);
        expect(data.filename).to.equal('test.md');
        expect(data.contentType).to.equal(type);
        expect(data.metadata.creator).to.deep.equal(creator);
        done();
      });
    });
  });

  it('should fail to store when input stream is not set', function(done) {
    var ObjectId = this.mongoose.Types.ObjectId;
    var filestore = this.helpers.requireBackend('core/filestore/gridfs');
    var id = new ObjectId();
    filestore.store(id, 'application/text', {creator: creator}, null, null, function(err, data) {
      expect(err).to.exist;
      done();
    });
  });

  it('should fail to store when input id is not set', function(done) {
    var filestore = this.helpers.requireBackend('core/filestore/gridfs');
    filestore.store(null, 'application/text', {creator: creator}, null, null, function(err, data) {
      expect(err).to.exist;
      done();
    });
  });

  // META

  it('should fail to get meta when input id is not set', function(done) {
    var filestore = this.helpers.requireBackend('core/filestore/gridfs');
    filestore.getMeta(null, function(err, data) {
      expect(err).to.exist;
      expect(data).to.not.exist;
      done();
    });
  });

  it('should return valid metadata', function(done) {
    var ObjectId = this.mongoose.Types.ObjectId;
    var filestore = this.helpers.requireBackend('core/filestore/gridfs');
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

    var id = new ObjectId();
    filestore.store(id, 'application/text', userMeta, stream, {}, function(err, data) {
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

  it('should contain a valid filename', function(done) {
    var ObjectId = this.mongoose.Types.ObjectId;
    var filestore = this.helpers.requireBackend('core/filestore/gridfs');
    var file = path.resolve(this.testEnv.fixtures + '/README.md');
    var stream = require('fs').createReadStream(file);
    var userMeta = {
      creator: creator
    };

    var id = new ObjectId();
    filestore.store(id, 'application/text', userMeta, stream, {filename: 'yop.md'}, function(err, data) {
      if (err) {
        return done(err);
      }

      filestore.getMeta(id, function(err, data) {
        expect(err).to.not.exist;
        expect(data).to.exist;
        expect(data.filename).to.equal('yop.md');
        expect(data.metadata).to.deep.equal(userMeta);
        done();
      });
    });
  });


  it('should return null when trying to get metadata from unknown file', function(done) {
    var ObjectId = this.mongoose.Types.ObjectId;
    var filestore = this.helpers.requireBackend('core/filestore/gridfs');
    var id = new ObjectId();
    filestore.getMeta(id, function(err, data) {
      expect(err).to.not.exist;
      expect(data).to.not.exist;
      done();
    });
  });

  describe('addMeta() method', function() {
    it('should add metadata ', function(done) {
      var ObjectId = this.mongoose.Types.ObjectId;
      var filestore = this.helpers.requireBackend('core/filestore/gridfs');
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

      var id = new ObjectId();
      filestore.store(id, 'application/text', userMeta, stream, {}, function(err, data) {
        if (err) {
          return done(err);
        }

        filestore.addMeta(id, {metadata: {newMeta: 'yolo'}}, function(err) {
          if (err) {
            return done(err);
          }
          filestore.getMeta(id, function(err, storeMeta) {
            expect(err).to.be.not.ok;
            expect(storeMeta).to.be.an('object');
            expect(storeMeta.metadata).to.be.an('object');
            expect(storeMeta.metadata.foo).to.equal('bar');
            expect(storeMeta.metadata.qix).to.be.an('object');
            expect(storeMeta.metadata.qix.int).to.equal(1);
            expect(storeMeta.metadata.newMeta).to.equal('yolo');
            done();
          });
        });
      });
    });
  });

  // DELETE
  it('should fail to delete when input id is not set', function(done) {
    var filestore = this.helpers.requireBackend('core/filestore/gridfs');
    filestore.delete(null, function(err, data) {
      expect(err).to.exist;
      done();
    });
  });

  it('should send back null when trying to get delete from an unknown id', function(done) {
    var ObjectId = this.mongoose.Types.ObjectId;
    var filestore = this.helpers.requireBackend('core/filestore/gridfs');
    var id = new ObjectId();
    filestore.delete(id, function(err) {
      expect(err).to.not.exist;
      done();
    });
  });

  it('should delete a file from its id', function(done) {
    var ObjectId = this.mongoose.Types.ObjectId;
    var filestore = this.helpers.requireBackend('core/filestore/gridfs');
    var file = path.resolve(this.testEnv.fixtures + '/README.md');
    var stream = require('fs').createReadStream(file);

    var id = new ObjectId();
    filestore.store(id, 'application/text', {creator: creator}, stream, {}, function(err, data) {
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
    var filestore = this.helpers.requireBackend('core/filestore/gridfs');
    filestore.get(null, function(err, meta, stream) {
      expect(err).to.exist;
      done();
    });
  });

  it('should send back the file from its id', function(done) {
    var ObjectId = this.mongoose.Types.ObjectId;
    var filestore = this.helpers.requireBackend('core/filestore/gridfs');
    var file = path.resolve(this.testEnv.fixtures + '/README.md');
    var stream = require('fs').createReadStream(file);
    require('mongoose').set('debug', true);
    var id = new ObjectId();
    filestore.store(id, 'application/text', {creator: creator}, stream, {}, function(err, data) {
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
    var ObjectId = this.mongoose.Types.ObjectId;
    var filestore = this.helpers.requireBackend('core/filestore/gridfs');
    var file = path.resolve(this.testEnv.fixtures + '/README.md');
    var fs = require('fs');
    var stream = fs.createReadStream(file);
    var out = this.testEnv.tmp + '/' + uuid.v4();
    var outstream = fs.createWriteStream(out);

    var id = new ObjectId();
    filestore.store(id, 'application/text', {creator: creator}, stream, {}, function(err, data) {
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
  describe('getFileStream method', function() {
    it('should send back an error when trying to get a file from a null id', function(done) {
      var filestore = this.helpers.requireBackend('core/filestore/gridfs');
      filestore.getFileStream(null, function(err, meta, stream) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if the file does not exist', function(done) {
      var ObjectId = this.mongoose.Types.ObjectId;
      var filestore = this.helpers.requireBackend('core/filestore/gridfs');
      var id = new ObjectId();
      filestore.getFileStream(id, function(err, meta, stream) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back the stream when the file exists', function(done) {
      var ObjectId = this.mongoose.Types.ObjectId;
      var filestore = this.helpers.requireBackend('core/filestore/gridfs');
      var file = path.resolve(this.testEnv.fixtures + '/README.md');
      var fs = require('fs');
      var stream = fs.createReadStream(file);
      var out = this.testEnv.tmp + '/' + uuid.v4();
      var outstream = fs.createWriteStream(out);

      var id = new ObjectId();
      filestore.store(id, 'application/text', {creator: creator}, stream, {}, function(err, data) {
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
  });

  describe('find() method', function() {
    beforeEach(function(done) {
      var ObjectId = this.mongoose.Types.ObjectId;
      var filestore = this.helpers.requireBackend('core/filestore/gridfs');
      var file = path.resolve(this.testEnv.fixtures + '/README.md');
      var stream = require('fs').createReadStream(file);
      var self = this;
      function storeFile1() {
        var id = new ObjectId();
        var metadata = {
          creator: creator,
          label: 'test'
        };
        var options = {filename: 'test.md'};
        return q.nfcall(filestore.store, id, 'application/text', metadata, stream, options)
        .then(function() {
          return id;
        });
      }

      function storeFile2() {
        var id = new ObjectId();
        var metadata = {
          creator: creator,
          label: 'other'
        };
        var options = {filename: 'other.md'};
        return q.nfcall(filestore.store, id, 'application/text', metadata, stream, options)
        .then(function() {
          return id;
        });
      }

      q.all([storeFile1(), storeFile2(), storeFile1()]).then(function(results) {
        self.fileIds = results;
        done();
      }, done).done();
    });

    it('should return an array of matching files ObjectIds', function(done) {
      var filestore = this.helpers.requireBackend('core/filestore/gridfs');
      var ObjectId = this.mongoose.Types.ObjectId;
      filestore.find({}, function(err, resp) {
        expect(err).to.be.not.ok;
        expect(resp).to.be.an('array');
        expect(resp).to.have.length(3);
        expect(resp[0] instanceof ObjectId).to.be.true;
        expect(resp[1] instanceof ObjectId).to.be.true;
        expect(resp[2] instanceof ObjectId).to.be.true;
        done();
      });
    });

    it('should return an array of matching files ObjectIds (filename)', function(done) {
      var filestore = this.helpers.requireBackend('core/filestore/gridfs');
      var self = this;
      filestore.find({filename: 'other.md'}, function(err, resp) {
        expect(err).to.be.not.ok;
        expect(resp).to.be.an('array');
        expect(resp).to.have.length(1);
        expect(resp[0].equals(self.fileIds[1])).to.be.true;
        done();
      });
    });

    it('should return an array of matching files ObjectIds (metadata)', function(done) {
      var filestore = this.helpers.requireBackend('core/filestore/gridfs');
      filestore.find({'metadata.label': 'test'}, function(err, resp) {
        expect(err).to.be.not.ok;
        expect(resp).to.be.an('array');
        expect(resp).to.have.length(2);
        done();
      });
    });

  });
});
