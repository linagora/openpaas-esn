'use strict';

var mockery = require('mockery'),
    path = require('path'),
    fs = require('fs-extra');

before(function() {
  this.testEnv = {
    basePath: path.resolve(__dirname + '/../..'),
    tmp: path.resolve(__dirname + '/../../tmp'),
    fixtures: path.resolve(__dirname + '/fixtures'),
    mongoUrl: 'mongodb://localhost:27017/rse'
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
});

afterEach(function() {
  mockery.resetCache();
  mockery.deregisterAll();
  mockery.disable();
});
