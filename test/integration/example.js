'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;

describe('Example test', function() {

  beforeEach(function() {
    // Solve a phantomjs random fail, https://gist.github.com/tfnico/8471223
    browser.ignoreSynchronization = true;
    browser.get('/');
    browser.waitForAngular();
  });

  it('should succeed', function() {
    expect(browser.getTitle()).to.eventually.equal('Home - OpenPaas');
  });

});
