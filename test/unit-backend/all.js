/* eslint-disable no-process-env */

const mockery = require('mockery');
const chai = require('chai');
const path = require('path');
const fs = require('fs-extra');
const helpers = require('../helpers');
const testConfig = require('../config/servers-conf.js');

before(function() {
  chai.use(require('chai-shallow-deep-equal'));
  chai.use(require('sinon-chai'));
  chai.use(require('chai-as-promised'));

  const basePath = path.resolve(`${__dirname}/../..`);
  const tmpPath = path.resolve(basePath, testConfig.tmp);

  this.testEnv = {
    basePath: basePath,
    tmp: tmpPath,
    fixtures: path.resolve(`${__dirname}/fixtures`),
    initCore: callback => {
      const core = require(`${basePath}/backend/core`);

      core.init();
      if (callback) {
        callback();
      }

      return core;
    }
  };
  this.helpers = {};
  helpers(this.helpers, this.testEnv);

  this.helpers.objectIdMock = stringId => ({
    value: () => stringId,
    equals: otherObjectId => stringId === otherObjectId.value()
  });

  process.env.NODE_CONFIG = this.testEnv.tmp;
  process.env.NODE_ENV = 'test';
  fs.copySync(`${__dirname}/default.test.json`, `${this.testEnv.tmp}/default.json`);
});

after(function() {
  delete process.env.NODE_CONFIG;
  fs.unlinkSync(`${this.testEnv.tmp}/default.json`);
});

// https://github.com/mfncooper/mockery/issues/34
before(function() {
  require('canvas');
});

beforeEach(function() {
  mockery.enable({ warnOnReplace: false, warnOnUnregistered: false, useCleanCache: true });

  this.helpers.mock.winston();
});

afterEach(function() {
  mockery.resetCache();
  mockery.deregisterAll();
  mockery.disable();
});
