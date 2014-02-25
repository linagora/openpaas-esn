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
      var json = {name: 'Marketing', company_name: 'Corporate',
        administrator: {
          email: 'toto@corporate.com',
          lastname: 'Titi',
          firstname: 'Toto',
          password: 'secret'
        }
      };
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

  describe('POST /api/domains/createDomain/', function() {
    var webserver = null;
    var Domain;

    before(function() {
      Domain = mongoose.model('Domain');
      webserver = require(this.testEnv.basePath + '/backend/webserver');
    });

    it('should fail when administrator is not set', function(done) {
      request(webserver.application).post('/api/domains/createDomain/Marketing/Corporate').expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should fail when administrator is not set', function(done) {
      request(webserver.application).post('/api/domains/createDomain/Marketing/Corporate').expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should fail when administrator.email is not set', function(done) {
      var json = {
        administrator: {
          firstname: 'Toto',
          lastname: 'Titi',
          password: 'secret'
        }
      };

      request(webserver.application).post('/api/domains/createDomain/Marketing/Corporate').send(json).expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should fail when administrator.firstname is not set', function(done) {
      var json = {
        administrator: {
          lastname: 'Titi',
          password: 'secret',
          email: 'toto@corporate.com'
        }
      };

      request(webserver.application).post('/api/domains/createDomain/Marketing/Corporate').send(json).expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should fail when administrator.lastname is not set', function(done) {
      var json = {
        administrator: {
          password: 'secret',
          firstname: 'Toto',
          email: 'toto@corporate.com'
        }
      };

      request(webserver.application).post('/api/domains/createDomain/Marketing/Corporate').send(json).expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should fail when administrator.password is not set', function(done) {
      var json = {
        administrator: {
          firstname: 'Toto',
          lastname: 'Titi',
          email: 'toto@corporate.com'
        }
      };

      request(webserver.application).post('/api/domains/createDomain/Marketing/Corporate').send(json).expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should create a domain with name, company_name and administrator', function(done) {
      var json = {
        administrator: {
          firstname: 'Toto',
          lastname: 'Titi',
          password: 'secret',
          email: 'toto@corporate.com'
        }
      };

      request(webserver.application).post('/api/domains/createDomain/Marketing/Corporate').send(json).expect(200).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

  });

});
