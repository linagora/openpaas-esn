'use strict';

var expect = require('chai').expect,
    mongodb = require('mongodb');



describe('The core esn-config module', function() {

  before(function() {
    this.testEnv.writeDBConfigFile();
  });

  after(function() {
    this.testEnv.removeDBConfigFile();
  });

  beforeEach(function(done) {
    this.mongoose = require('mongoose');
    this.mongoose.connect(this.testEnv.mongoUrl, done);
  });

  afterEach(function(done) {
    this.mongoose.disconnect(done);
  });

  it('should be a function', function() {
    var esnConfig = require(this.testEnv.basePath + '/backend/core')['esn-config'];
    expect(esnConfig).to.be.a.function;
  });

  it('should be a function that got three methods: get, set and store', function() {
    var esnConfig = require(this.testEnv.basePath + '/backend/core')['esn-config'];
    var testConfig = esnConfig('test');
    expect(testConfig).to.have.property('get');
    expect(testConfig).to.have.property('set');
    expect(testConfig).to.have.property('store');
  });

  it('should return null when the namespace is not set', function() {
    var esnConfig = require(this.testEnv.basePath + '/backend/core')['esn-config'];
    var testConfig = esnConfig();
    expect(testConfig).to.be.null;
    testConfig = esnConfig('');
    expect(testConfig).to.be.null;
  });

  describe('get method', function() {
    beforeEach(function(done) {
      var injected = this.injected = {
        _id: 'user',
        name: 'Dean',
        firstname: 'James',
        options: {
          birth: 1931
        }
      };
      mongodb.MongoClient.connect(this.testEnv.mongoUrl, function(err, db) {
        if (err) {
          return done(err);
        }
        db.collection('configuration').insert(injected, function(err) {
          if (err) {
            return done(err);
          }
          db.close(function() {
            done();
          });
        });
      });
    });

    it('should load the object from the datastore', function(done) {
      var esnConfig = require(this.testEnv.basePath + '/backend/core')['esn-config'];
      var testConfig = esnConfig('user');
      var injected = this.injected;
      testConfig.get(function(err, user) {
        expect(err).to.be.null;
        expect(user).to.exist;
        expect(user).to.deep.equal(injected);
        done();
      });
    });

    it('should load the object from the datastore and return the asked key', function(done) {
      var esnConfig = require(this.testEnv.basePath + '/backend/core')['esn-config'];
      var testConfig = esnConfig('user');
      var injected = this.injected;
      testConfig.get('name', function(err, user) {
        expect(err).to.be.null;
        expect(user).to.exist;
        expect(user).to.equal(injected.name);
        done();
      });
    });

    it('should load the object from the datastore and return the asked key using dot notation', function(done) {
      var esnConfig = require(this.testEnv.basePath + '/backend/core')['esn-config'];
      var testConfig = esnConfig('user');
      var injected = this.injected;
      testConfig.get('options.birth', function(err, user) {
        expect(err).to.be.null;
        expect(user).to.exist;
        expect(user).to.equal(injected.options.birth);
        done();
      });

    });

    it('should return null if the object does not exist in the datastore', function(done) {
      var esnConfig = require(this.testEnv.basePath + '/backend/core')['esn-config'];
      var testConfig = esnConfig('idontexist');
      testConfig.get(function(err, user) {
        expect(err).to.be.null;
        expect(user).to.be.null;
        done();
      });

    });

    afterEach(function(done) {
      mongodb.MongoClient.connect(this.testEnv.mongoUrl, function(err, db) {
        if (err) {
          return done(err);
        }
        db.dropCollection('configuration', function(err) {
          if (err) {
            return done(err);
          }
          db.close(function() {
            done();
          });
        });
      });
    });
  });

  describe('set method', function() {
    beforeEach(function(done) {
      var injected = this.injected = {
        _id: 'user',
        name: 'Dean',
        firstname: 'James',
        options: {
          birth: 1931
        }
      };
      mongodb.MongoClient.connect(this.testEnv.mongoUrl, function(err, db) {
        if (err) { return done(err); }
        db.collection('configuration').insert(injected, function(err) {
          if (err) { return done(err); }
          db.close(function() { done(); });
        });
      });
    });

    it('should send back an error if the key is not set', function() {
      var testConfig = require(this.testEnv.basePath + '/backend/core')['esn-config']('test');
      testConfig.set(null, false, function(err) {
        expect(err).to.exist;
      });
      testConfig.set('', false, function(err) {
        expect(err).to.exist;
      });
    });

    it('should upsert the object in the datastore', function(done) {
      var mongoUrl = this.testEnv.mongoUrl;
      var esnConfig = require(this.testEnv.basePath + '/backend/core')['esn-config'];
      var testConfig = esnConfig('user');
      testConfig.set('foo', 'bar', function(err) {
        if (err) { return done(err); }
        mongodb.MongoClient.connect(mongoUrl, function(err, db) {
          if (err) { return done(err); }
          db.collection('configuration').findOne({_id: 'user'}, function(err, user) {
            if (err) { return done(err); }
            expect(user).to.exist;
            expect(user.foo).to.equal('bar');
            db.close(function() { done(); });
          });
        });
      });

    });

    afterEach(function(done) {
      mongodb.MongoClient.connect(this.testEnv.mongoUrl, function(err, db) {
        if (err) {
          return done(err);
        }
        db.dropCollection('configuration', function(err) {
          if (err) {
            return done(err);
          }
          db.close(function() {
            done();
          });
        });
      });
    });

  });

  describe('store method', function() {
    beforeEach(function(done) {
      var injected = this.injected = {
        _id: 'user',
        name: 'Dean',
        firstname: 'James',
        options: {
          birth: 1931
        }
      };
      mongodb.MongoClient.connect(this.testEnv.mongoUrl, function(err, db) {
        if (err) { return done(err); }
        db.collection('configuration').insert(injected, function(err) {
          if (err) { return done(err); }
          db.close(function() { done(); });
        });
      });
    });

    it('should return an error is the configuration is not an object', function() {
      var testConfig = require(this.testEnv.basePath + '/backend/core')['esn-config']('test');
      testConfig.store(null, function(err) {
        expect(err).to.exist;
      });
      testConfig.store(undefined, function(err) {
        expect(err).to.exist;
      });
      testConfig.store('Im not an object ?', function(err) {
        expect(err).to.exist;
      });
    });

    it('should save the object in the datastore', function(done) {
      var mongoUrl = this.testEnv.mongoUrl;
      var esnConfig = require(this.testEnv.basePath + '/backend/core')['esn-config'];
      var testConfig = esnConfig('test');
      var testObject = {foo: 'bar', ok: true};
      testConfig.store(testObject, function() {
        mongodb.MongoClient.connect(mongoUrl, function(err, db) {
          if (err) { return done(err); }
          db.collection('configuration').findOne({_id: 'test'}, function(err, testObject) {
            if (err) { return done(err); }
            expect(testObject).to.exist;
            expect(testObject.foo).to.equal('bar');
            expect(testObject.ok).to.be.true;
            db.close(function() { done(); });
          });
        });
      });
    });

    it('should allow saving an already saved object in the datastore', function(done) {
      var mongoUrl = this.testEnv.mongoUrl;
      var esnConfig = require(this.testEnv.basePath + '/backend/core')['esn-config'];
      var testConfig = esnConfig('test');
      var testObject = {foo: 'bar', ok: true};
      testConfig.store(testObject, function(err) {
        if (err) { return done(err); }
        testConfig.store(testObject, function(err) {
          if (err) { return done(err); }

          mongodb.MongoClient.connect(mongoUrl, function(err, db) {
            if (err) { return done(err); }
            db.collection('configuration').findOne({_id: 'test'}, function(err, testObject) {
              if (err) { return done(err); }
              expect(testObject).to.exist;
              expect(testObject.foo).to.equal('bar');
              expect(testObject.ok).to.be.true;
              db.close(function() { done(); });
            });
          });
        });
      });
    });

    it('should overwrite the document in the store', function(done) {
      var mongoUrl = this.testEnv.mongoUrl;
      var esnConfig = require(this.testEnv.basePath + '/backend/core')['esn-config'];
      var testConfig = esnConfig('test');
      var testObject = {foo: 'bar', ok: true};
      testConfig.store(testObject, function(err) {
        if (err) { return done(err); }
        testConfig.store({}, function(err) {
          if (err) { return done(err); }

          mongodb.MongoClient.connect(mongoUrl, function(err, db) {
            if (err) { return done(err); }
            db.collection('configuration').findOne({_id: 'test'}, function(err, testObject) {
              if (err) { return done(err); }
              expect(testObject).to.exist;
              expect(testObject.foo).to.not.exist;
              expect(testObject.ok).to.not.exist;
              db.close(function() { done(); });
            });
          });
        });
      });
    });

    afterEach(function(done) {
      mongodb.MongoClient.connect(this.testEnv.mongoUrl, function(err, db) {
        if (err) {
          return done(err);
        }
        db.dropCollection('configuration', function(err) {
          if (err) {
            return done(err);
          }
          db.close(function() {
            done();
          });
        });
      });
    });
  });
});
