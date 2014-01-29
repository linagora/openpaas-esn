'use strict';

var expect = require('chai').expect;
var BASEPATH = '../../..';
var path = require('path');
var fs = require('fs');
var tmp = path.resolve(__dirname + BASEPATH + '/../tmp');

describe('The Core configured module', function() {

  beforeEach(function() {
    process.env.NODE_CONFIG = tmp;
  });

  afterEach(function() {
    delete process.env.NODE_CONFIG;
  });

  it('should return false if the db.json file does not exist', function() {
    var isConfigured = require(BASEPATH + '/backend/core').configured;

    expect(isConfigured()).to.be.false;
  });

  it('should return false if the db.json file exists but does not contain the tested key(port)', function() {
    var isConfigured = require(BASEPATH + '/backend/core').configured;

    fs.writeFileSync(tmp + '/db.json', JSON.stringify({hostname: 'test', dbname: 'test'}));
    expect(isConfigured()).to.be.false;
  });

  it('should return true if the db.json file exists and contains the tested key(port)', function() {
    var isConfigured = require(BASEPATH + '/backend/core').configured;

    fs.writeFileSync(tmp + '/db.json', JSON.stringify({hostname: 'test', dbname: 'test', port: 1337}));
    expect(isConfigured()).to.be.true;
  });

});
