'use strict';

//jscs:disable

var testConfig = require('./servers-conf.js'),
    globalPhantomjsBin = require('fs').existsSync('/usr/local/bin/phantomjs') ? '/usr/local/bin/phantomjs' : undefined,
    seleniumWebapp = 'http://localhost:4444';


exports.config = {
  baseUrl: 'http://' + testConfig.host + ':8080',
  seleniumWebapp: seleniumWebapp,
  seleniumAddress: seleniumWebapp + '/wd/hub',
  framework: 'cucumber',
  capabilities: {
    'browserName': process.env.BROWSER || 'phantomjs',
    'phantomjs.binary.path': process.env.PHANTOMJS_BIN || globalPhantomjsBin || './node_modules/karma-phantomjs-launcher/node_modules/phantomjs/bin/phantomjs',
    'phantomjs.ghostdriver.cli.args': ''
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
