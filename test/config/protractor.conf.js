'use strict';

var seleniumWebapp = 'http://localhost:4444',
    testConfig = require('./servers-conf.js'),
    baseHost = process.env.LOCAL ? testConfig.host : 'esn_webapp';

exports.config = {
  baseUrl: 'http://' + baseHost + ':8080',
  directConnect: process.env.LOCAL,
  seleniumWebapp: seleniumWebapp,
  seleniumAddress: seleniumWebapp + '/wd/hub',
  framework: 'custom',
  frameworkPath: require.resolve('protractor-cucumber-framework'),
  capabilities: {
    browserName: process.env.BROWSER || 'firefox'
  },
  suites: {
    modules: '../../modules/**/test/e2e/**/*.feature',
    core: '../e2e/**/*.feature'
  },
  cucumberOpts: {
    require: [
      './cucumber.conf.js',
      '../../modules/**/test/e2e/**/*.js',
      '../e2e/**/*.js'
    ],
    format: 'pretty',
    tags: process.env.TAGS
  }
};
