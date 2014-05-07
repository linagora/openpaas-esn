'use strict';

var expect = require('chai').expect,
    fs = require('fs');

describe('The Core configured module', function() {
  var isConfigured = null;

  beforeEach(function() {
    isConfigured = require(this.testEnv.basePath + '/backend/core').configured;
  });

  it('should return false if the db.json file does not exist', function() {
    expect(isConfigured()).to.be.false;
  });

  it('should return false if the db.json file exists but does not contain the tested key(connectionString)', function() {
    fs.writeFileSync(this.testEnv.tmp + '/db.json', JSON.stringify({hostname: 'test', dbname: 'test'}));
    expect(isConfigured()).to.be.false;
  });

  it('should return true if the db.json file exists and contains the tested key(connectionString)', function() {
    fs.writeFileSync(this.testEnv.tmp + '/db.json', JSON.stringify({connectionString: 'test'}));
    expect(isConfigured()).to.be.true;
  });

  afterEach(function() {
    try {
      fs.unlinkSync(this.testEnv.tmp + '/db.json');
    } catch (e) {}
  });
});
