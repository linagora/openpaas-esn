'use strict';

//jscs:disable

var seleniumWebapp = 'http://localhost:4444';

exports.config = {
  baseUrl: 'http://esn_webapp:8080',
  seleniumWebapp: seleniumWebapp,
  seleniumAddress: seleniumWebapp + '/wd/hub',
  framework: 'custom',
  frameworkPath: require.resolve('protractor-cucumber-framework'),
  capabilities: {
    'browserName': process.env.BROWSER || 'firefox'
  },
  suites: {
    'modules': '../../modules/**/test/e2e/**/*.feature',
    'core': '../e2e/**/*.feature'
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
