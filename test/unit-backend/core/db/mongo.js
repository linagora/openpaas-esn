'use strict';

var expect = require('chai').expect;

describe('The Core DB MongoDB module', function() {
  var mongo = null;

  before(function() {
    mongo = require(this.testEnv.basePath + '/backend/core').db.mongo;
  });

  describe('getConnectionString method', function() {

    it('should return a string mongodb://hostname:port/dbname', function() {
      expect(mongo.getConnectionString('localhost', 'port', 'base', null, null, {})).to.equal('mongodb://localhost:port/base');
    });

    it('should return a string mongodb://username:password@hostname:port/dbname', function() {
      expect(mongo.getConnectionString('localhost', 'port', 'base', 'user', 'pass', {})).to.equal('mongodb://user:pass@localhost:port/base');
    });
  });
});
