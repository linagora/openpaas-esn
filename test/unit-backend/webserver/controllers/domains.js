'use strict';

var fs = require('fs-extra');
var expect = require('chai').expect;
var request = require('supertest');
var mongoose = require('mongoose');

describe('The domains routes resource', function() {
  var tmpDbConfigFile = null;

  before(function() {

    this.testEnv.writeDBConfigFile();
    mongoose.connect(this.testEnv.mongoUrl);

    tmpDbConfigFile = this.testEnv.tmp + '/db.json';
    fs.copySync(this.testEnv.fixtures + '/config/db.json', tmpDbConfigFile);
  });

  afterEach(function(done) {
    this.testEnv.removeDBConfigFile();
    mongoose.connection.db.dropDatabase();
    mongoose.disconnect(done);

    try {
      fs.unlinkSync(tmpDbConfigFile);
    } catch (err) {}
  });

  describe('GET /api/domains/company', function() {
    var webserver = null;

    before(function() {
        webserver = require(this.testEnv.basePath + '/backend/webserver');
        var port = require(this.testEnv.basePath + '/backend/core').config('default').webserver.port;
        webserver.start(port);
      });

    it('should return a JSON with 404 result when company doesnt exist within domains', function(done) {
      request(webserver.application).get('/api/domains/company/' + 'Corporate').expect(404).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        expect(res.body.exists).to.be.false;
        done();
      });
    });
  });

});
