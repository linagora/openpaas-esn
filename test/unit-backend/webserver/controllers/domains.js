'use strict';

var expect = require('chai').expect;
var request = require('supertest');
var mongoose = require('mongoose');

describe('The domains routes resource', function() {

  before(function() {
    this.testEnv.writeDBConfigFile();
    mongoose.connect(this.testEnv.mongoUrl);

  });

  after(function(done) {
    this.testEnv.removeDBConfigFile();
    mongoose.connection.db.dropDatabase();
    mongoose.disconnect(done);
  });

  describe('GET /api/domains/company', function() {
    var webserver = null;
    var Domain;

    before(function() {
        Domain = mongoose.model('Domain');
        webserver = require(this.testEnv.basePath + '/backend/webserver');
      });

    it('should return a JSON with 404 result when company doesnt exist within domains', function(done) {
      request(webserver.application).head('/api/domains/company/' + 'Corporate').expect(404).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return a JSON with 200 result when company exists among domains', function(done) {
      var json = {name: 'Marketing', company_name: 'Corporate'};
      var i = new Domain(json);

      i.save(function(err, domain) {
        if (err) {
          return done(err);
        }

        request(webserver.application).head('/api/domains/company/' + domain.company_name).expect(200).end(function(err, res) {
          expect(err).to.be.null;
          done();
        });
      });
    });
  });

});
