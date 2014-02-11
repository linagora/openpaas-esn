'use strict';

var expect = require('chai').expect;
var path = require('path');
var fs = require('fs');
var BASEPATH = '../../../..';
var tmp = path.resolve(__dirname + BASEPATH + '/../tmp');

describe('The User template module', function() {

  describe('If not configured', function() {
    beforeEach(function() {
      process.env.NODE_CONFIG = tmp;
      try {
        fs.unlinkSync(tmp + '/db.json');
      } catch (e) {}
    });
    it('should not inject templates', function(done) {
      var core = require(BASEPATH + '/backend/core');
      var templates = core.templates;
      var configured = core.configured;
      expect(configured()).to.be.false;
      templates.inject(done);
    });
  });

  describe('If configured', function() {

    beforeEach(function() {
      var mongo = {hostname: 'localhost', port: 27017, dbname: 'test'};
      process.env.NODE_CONFIG = tmp;
      fs.writeFileSync(tmp + '/db.json', JSON.stringify(mongo));
    });

    it('should inject templates', function(done) {
      var core = require('../../../../backend/core');
      var templates = core.templates;
      var configured = core.configured;
      expect(configured()).to.be.true;
      templates.inject(done);
    });

    afterEach(function() {
      fs.unlinkSync(tmp + '/db.json');
    });
  });

});
