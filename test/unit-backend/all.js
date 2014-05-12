'use strict';

var mockery = require('mockery'),
    path = require('path'),
    fs = require('fs-extra');
var testConfig = require('../config/servers-conf.js');

before(function() {
  var basePath = path.resolve(__dirname + '/../..');
  var tmpPath = path.resolve(basePath, 'tmp');
  this.testEnv = {
    serversConfig: testConfig,
    basePath: basePath,
    tmp: tmpPath,
    fixtures: path.resolve(__dirname + '/fixtures'),
    initCore: function(callback) {
      var core = require(basePath + '/backend/core');
      core.init();
      if (callback) {
        callback();
      }
      return core;
    }
  };
  process.env.NODE_CONFIG = this.testEnv.tmp;
  process.env.NODE_ENV = 'test';
  fs.copySync(__dirname + '/default.test.json', this.testEnv.tmp + '/default.json');
});

after(function() {
  delete process.env.NODE_CONFIG;
  fs.unlinkSync(this.testEnv.tmp + '/default.json');
});

beforeEach(function() {
  mockery.enable({warnOnReplace: false, warnOnUnregistered: false, useCleanCache: true});
  mockery.registerMock('./logger', require(this.testEnv.fixtures + '/logger-noop')());
});

afterEach(function() {
  mockery.resetCache();
  mockery.deregisterAll();
  mockery.disable();
});
