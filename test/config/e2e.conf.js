exports.config = {
  baseUrl: 'http://localhost:8080',
  seleniumAddress: 'http://localhost:4444/wd/hub',
  framework: 'cucumber',
  capabilities: {
    'browserName': 'phantomjs',
    'phantomjs.binary.path': require('phantomjs').path,
    'phantomjs.ghostdriver.cli.args': '--debug=true --webdriver --webdriver-logfile=webdriver.log --webdriver-loglevel=DEBUG'
  },
  suites: {
    cucumber: '../features/cucumber.feature',
    login: '../features/login/login.feature'
  },
  cucumberOpts: {
    require: '../features/steps/*.js',
    format: 'pretty'
  }
}
