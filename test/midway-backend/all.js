'use strict';

var mockery = require('mockery'),
    path = require('path'),
    fs = require('fs');

before(function() {
  this.testEnv = {
    basePath: path.resolve(__dirname + '/../..'),
    tmp: path.resolve(__dirname + '/../../tmp'),
    fixtures: path.resolve(__dirname + '/fixtures'),
    mongoUrl: 'mongodb://localhost:27017/midway-test'
  };
  process.env.NODE_CONFIG = this.testEnv.tmp;
  process.env.NODE_ENV = 'test';
  fs.writeFileSync(this.testEnv.tmp + '/db.json', JSON.stringify({hostname: 'localhost', dbname: 'midway-test', port: 27017}));
});

after(function() {
  fs.unlinkSync(this.testEnv.tmp + '/db.json');
});

beforeEach(function() {
  mockery.enable({warnOnReplace: false, warnOnUnregistered: false, useCleanCache: true});
});

afterEach(function() {
  mockery.resetCache();
  mockery.deregisterAll();
  mockery.disable();
});

