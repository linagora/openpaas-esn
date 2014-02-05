'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var BASEPATH = '../../..';

describe('The core esn-config module', function() {

  beforeEach(function() {
    var mongoMock = this.mongoMock = {
    };

    this.coreMock = {
      db: {
        mongo: mongoMock
      }
    };

    mockery.registerMock('../../core', this.coreMock);
  });

  it('should be a function', function() {
    var esnConfig = require(BASEPATH + '/backend/core/esn-config');
    expect(esnConfig).to.be.a.function;
  });

  it('should be a function that got three methods: get, set and store', function() {
    var esnConfig = require(BASEPATH + '/backend/core/esn-config');
    var testConfig = esnConfig('test');
    expect(testConfig).to.have.property('get');
    expect(testConfig).to.have.property('set');
    expect(testConfig).to.have.property('store');
  });

  it('should return null when the namespace is not set', function() {
    var esnConfig = require(BASEPATH + '/backend/core/esn-config');
    var testConfig = esnConfig();
    expect(testConfig).to.be.null;
    testConfig = esnConfig('');
    expect(testConfig).to.be.null;
  });

  describe('get method', function() {
    it('should load the object from the datastore', function(done) {
      var mongoCollectionMock = {
        findOne: function(what, callback) {
          expect(what._id).to.exist;
          expect(what._id).to.equal('test');
          done();
        }
      };

      var mongoDbMock = {
        collection: function(name) {
          expect(name).to.equal('configuration');
          return mongoCollectionMock;
        }
      };
      this.mongoMock.client = function(callback) {
        return callback(null, mongoDbMock);
      };

      var esnConfig = require(BASEPATH + '/backend/core/esn-config');
      var testConfig = esnConfig('test');
      testConfig.get();
    });

    it('should load the object from the datastore and return the object', function(done) {
      var obj = {
        host: 'test.linagora.com',
        port: 42,
        options: {
          neverFails: true
        }
      };

      var mongoCollectionMock = {
        findOne: function(what, callback) {
          expect(what._id).to.exist;
          expect(what._id).to.equal('test');
          callback(null, obj);
        }
      };

      var mongoDbMock = {
        collection: function(name) {
          expect(name).to.equal('configuration');
          return mongoCollectionMock;
        }
      };
      this.mongoMock.client = function(callback) {
        return callback(null, mongoDbMock);
      };

      var esnConfig = require(BASEPATH + '/backend/core/esn-config');
      var testConfig = esnConfig('test');
      testConfig.get(function(err, key) {
        expect(key).to.deep.equal(obj);
        done();
      });
    });

    it('should load the object from the datastore and return the asked key', function(done) {

      var obj = {
        host: 'test.linagora.com',
        port: 42,
        options: {
          neverFails: true
        }
      };

      var mongoCollectionMock = {
        findOne: function(what, callback) {
          expect(what._id).to.exist;
          expect(what._id).to.equal('test');
          callback(null, obj);
        }
      };

      var mongoDbMock = {
        collection: function(name) {
          expect(name).to.equal('configuration');
          return mongoCollectionMock;
        }
      };
      this.mongoMock.client = function(callback) {
        return callback(null, mongoDbMock);
      };

      var esnConfig = require(BASEPATH + '/backend/core/esn-config');
      var testConfig = esnConfig('test');
      testConfig.get('host', function(err, key) {
        expect(key).to.equal('test.linagora.com');
        done();
      });
    });

    it('should load the object from the datastore and return the asked key using dot notation', function(done) {

      var obj = {
        host: 'test.linagora.com',
        port: 42,
        options: {
          neverFails: true
        }
      };

      var mongoCollectionMock = {
        findOne: function(what, callback) {
          expect(what._id).to.exist;
          expect(what._id).to.equal('test');
          callback(null, obj);
        }
      };

      var mongoDbMock = {
        collection: function(name) {
          expect(name).to.equal('configuration');
          return mongoCollectionMock;
        }
      };
      this.mongoMock.client = function(callback) {
        return callback(null, mongoDbMock);
      };

      var esnConfig = require(BASEPATH + '/backend/core/esn-config');
      var testConfig = esnConfig('test');
      testConfig.get('options.neverFails', function(err, key) {
        expect(key).to.be.true;
        done();
      });
    });
  });

  describe('set method', function() {

    it('should send back an error if the key is not set', function() {
      var testConfig = require(BASEPATH + '/backend/core/esn-config')('test');
      testConfig.set(null, false, function(err) {
        expect(err).to.exist;
      });
      testConfig.set('', false, function(err) {
        expect(err).to.exist;
      });
    });

    it('should upsert the object in the datastore', function(done) {
      var mongoCollectionMock = {
        update: function(selector, update, options, callback) {
          expect(selector._id).to.exist;
          expect(selector._id).to.equal('test');
          expect(update.foo).to.equal('bar');
          expect(options.upsert).to.be.true;
          done();
        }
      };

      var mongoDbMock = {
        collection: function(name) {
          expect(name).to.equal('configuration');
          return mongoCollectionMock;
        }
      };
      this.mongoMock.client = function(callback) {
        return callback(null, mongoDbMock);
      };

      var esnConfig = require(BASEPATH + '/backend/core/esn-config');
      var testConfig = esnConfig('test');
      testConfig.set('foo', 'bar');
    });
  });

  describe('store method', function() {
    it('should return an error is the configuration is not an object', function() {
      var testConfig = require(BASEPATH + '/backend/core/esn-config')('test');
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
      var mongoCollectionMock = {
        save: function(cfg, callback) {
          expect(cfg._id).to.exist;
          expect(cfg._id).to.equal('test');
          expect(cfg.foo).to.equal('bar');
          expect(cfg.ok).to.be.true;
          done();
        }
      };

      var mongoDbMock = {
        collection: function(name) {
          expect(name).to.equal('configuration');
          return mongoCollectionMock;
        }
      };
      this.mongoMock.client = function(callback) {
        return callback(null, mongoDbMock);
      };

      var esnConfig = require(BASEPATH + '/backend/core/esn-config');
      var testConfig = esnConfig('test');
      testConfig.store({foo: 'bar', ok: true});
    });
  });
});
