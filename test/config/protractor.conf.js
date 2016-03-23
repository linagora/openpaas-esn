'use strict';

//jscs:disable

var testConfig = require('./servers-conf.js');
var globalPhantomjsBin = require('fs').existsSync('/usr/local/bin/phantomjs') ? '/usr/local/bin/phantomjs' : undefined;

exports.config = {
  baseUrl: 'http://' + testConfig.host + ':' + testConfig.express.port,
  seleniumAddress: 'http://localhost:4444/wd/hub',
  framework: 'mocha',
  capabilities: {
    'browserName': process.env.BROWSER || 'phantomjs',
    'phantomjs.binary.path': process.env.PHANTOMJS_BIN || globalPhantomjsBin || './node_modules/karma-phantomjs-launcher/node_modules/phantomjs/bin/phantomjs',
    'phantomjs.ghostdriver.cli.args': ''
  },
  suites: {
    'all': '../integration/*'
  },
  mochaOpts: {
    timeout: 10000
  }
};
