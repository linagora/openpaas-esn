'use strict';

var mockery = require('mockery'),
    path = require('path'),
    fs = require('fs'),
    helpers = require('../helpers');
var testConfig = require('../config/servers-conf.js');

before(function(done) {
  var basePath = path.resolve(__dirname + '/../..');
  var tmpPath = path.resolve(basePath, 'tmp');
  this.testEnv = {
    serversConfig: testConfig,
    basePath: basePath,
    tmp: tmpPath,
    fixtures: path.resolve(__dirname + '/fixtures'),
    mongoUrl: 'mongodb://localhost:' + testConfig.mongodb.port + '/' + testConfig.mongodb.dbname,
    initCore: function(callback) {
      var core = require(basePath + '/backend/core');
      core.init();
      if (callback) {
        process.nextTick(callback);
      }
      return core;
    }
  };

  this.helpers = helpers;
  process.env.NODE_CONFIG = this.testEnv.tmp;
  process.env.NODE_ENV = 'test';
  fs.writeFileSync(this.testEnv.tmp + '/db.json', JSON.stringify(
    {
      hostname: 'localhost',
      dbname: testConfig.mongodb.dbname,
      port: testConfig.mongodb.port
    }
  ));
  done();
  //helpers.mongo.connect(done);
});

after(function(done) {
  fs.unlinkSync(this.testEnv.tmp + '/db.json');
  //helpers.mongo.disconnect(done);
  done();
});

beforeEach(function() {
  mockery.enable({warnOnReplace: false, warnOnUnregistered: false, useCleanCache: true});
});

afterEach(function() {
  mockery.resetCache();
  mockery.deregisterAll();
  mockery.disable();
});

