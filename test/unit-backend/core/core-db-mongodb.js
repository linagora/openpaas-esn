'use strict';

var expect = require('chai').expect;
var BASEPATH = '../../..';

describe('The Core DB MongoDB module', function() {
  describe('getConnectionString method', function() {
    it('should return a string mongodb://hostname:port/dbname', function() {
      var mongo = require(BASEPATH + '/backend/core/db/mongodb');
      expect(mongo.getConnectionString('localhost', 'port', 'base', null, null, {})).to.equal('mongodb://localhost:port/base');
    });

    it('should return a string mongodb://username:password@hostname:port/dbname', function() {
      var mongo = require(BASEPATH + '/backend/core/db/mongodb');
      expect(mongo.getConnectionString('localhost', 'port', 'base', 'user', 'pass', {})).to.equal('mongodb://user:pass@localhost:port/base');
    });
  });
});
