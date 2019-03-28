'use strict';

var mongoose = require('mongoose'),
    mockery = require('mockery'),
    chai = require('chai'),
    path = require('path'),
    fs = require('fs-extra'),
    helpers = require('../helpers'),
    apiHelpers = require('../api-helpers'),
    moduleHelpers = require('../module-helpers');

var testConfig = require('../config/servers-conf.js');

before(function() {
  var self = this;

  chai.use(require('chai-shallow-deep-equal'));
  chai.use(require('sinon-chai'));
  chai.use(require('chai-as-promised'));
  var basePath = path.resolve(__dirname + '/../..');
  var tmpPath = path.resolve(basePath, testConfig.tmp);
  this.testEnv = {
    serversConfig: testConfig,
    basePath: basePath,
    tmp: tmpPath,
    fixtures: path.resolve(__dirname + '/fixtures'),
    mongoUrl: 'mongodb://' + testConfig.mongodb.host + ':' + testConfig.mongodb.port + '/' + testConfig.mongodb.dbname,
    writeDBConfigFile: function() {
      fs.writeFileSync(tmpPath + '/db.json', JSON.stringify({connectionString: 'mongodb://' + testConfig.mongodb.host + ':' + testConfig.mongodb.port + '/' + testConfig.mongodb.dbname}));
    },
    removeDBConfigFile: function() {
      fs.unlinkSync(tmpPath + '/db.json');
    },
    initCore: function(callback) {
      var core = require(basePath + '/backend/core');
      core.init();
      if (callback) {
        callback();
      }
      return core;
    }
  };
  this.helpers = {};
  helpers(this.helpers, this.testEnv);
  moduleHelpers(this.helpers, this.testEnv);
  apiHelpers(this.helpers, this.testEnv);

  process.env.NODE_CONFIG = this.testEnv.tmp;
  process.env.NODE_ENV = 'test';
  fs.copySync(__dirname + '/default.test.json', this.testEnv.tmp + '/default.json');

  this.connectMongoose = function(mongoose, done) {
    mongoose.Promise = require('q').Promise; // http://mongoosejs.com/docs/promises.html
    mongoose.connect(self.testEnv.mongoUrl, done);
  };
});

// https://github.com/mfncooper/mockery/issues/34
before(function() {
  require('canvas');
});

after(function(done) {
  delete process.env.NODE_CONFIG;
  fs.unlinkSync(this.testEnv.tmp + '/default.json');
  this.helpers.mongo.dropDatabase(done);
});

beforeEach(function() {
  mockery.enable({warnOnReplace: false, warnOnUnregistered: false, useCleanCache: true});
});

afterEach(function() {
  try {
    mongoose.disconnect();
  } catch (e) {
    console.error(e);
  }
  try {
    this.helpers.requireBackend('core/db/mongo/file-watcher').clear();
  } catch (e) {
    console.error(e);
  }
  mockery.resetCache();
  mockery.deregisterAll();
  mockery.disable();
});
