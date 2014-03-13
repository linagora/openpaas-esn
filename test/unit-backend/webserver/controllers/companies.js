'use strict';

var expect = require('chai').expect;
var request = require('supertest');

describe('The companies routes', function() {
  before(function() {
    this.mongoose = require('mongoose');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/domain');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
    this.testEnv.writeDBConfigFile();
    this.mongoose.connect(this.testEnv.mongoUrl);

  });

  after(function(done) {
    this.testEnv.removeDBConfigFile();
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });

  beforeEach(function(done) {
    this.testEnv.initCore(done);
  });

  describe('HEAD /api/companies', function() {
    var webserver = null;
    var Domain;
    var User, emails;

    before(function() {

      Domain = this.mongoose.model('Domain');
      User = this.mongoose.model('User');
      emails = ['foo@linagora.com', 'bar@linagora.com'];

      webserver = require(this.testEnv.basePath + '/backend/webserver');
    });

    it('should return a JSON with 404 result when company does not exist', function(done) {
      request(webserver.application).head('/api/companies').query({name: 'Corporate'}).expect(404).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return a JSON with 200 result when company exists', function(done) {
      var u = new User({ firstname: 'foo', lastname: 'bar', emails: emails});

      var json = {name: 'Marketing', company_name: 'Corporate',
        administrator: u
      };
      var domain = new Domain(json);

      domain.save(function(err, domain) {
        if (err) { return done(err); }
        request(webserver.application).head('/api/companies').query({name: 'Corporate'}).expect(200).end(function(err, res) {
          expect(err).to.be.null;
          domain.remove(function() { done(); });
        });
      });
    });
  });

  describe('GET /api/companies', function() {
    var webserver = null;
    var Domain;
    var User, emails;

    before(function() {

      Domain = this.mongoose.model('Domain');
      User = this.mongoose.model('User');
      emails = ['foo@linagora.com', 'bar@linagora.com'];

      webserver = require(this.testEnv.basePath + '/backend/webserver');
    });

    it('should return a JSON with 404 result when company does not exist', function(done) {
      request(webserver.application).get('/api/companies').query({name: 'Corporate'}).expect(404).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return a JSON with 200 result when company exists', function(done) {
      var u = new User({ firstname: 'foo', lastname: 'bar', emails: emails});

      var json = {
        name: 'Marketing',
        company_name: 'Corporate',
        administrator: u
      };
      var domain = new Domain(json);

      domain.save(function(err, domain) {
        if (err) { return done(err); }
        request(webserver.application).get('/api/companies').query({name: 'Corporate'})
        .expect(200)
        .expect(function(res) {
          expect(res.body).to.be.an.array;
          expect(res.body).to.have.length(1);
          expect(res.body[0]).to.deep.equal({name: 'Corporate'});
        })
        .end(function(err, res) {
          expect(err).to.be.null;
          domain.remove(function() { done(); });
        });
      });
    });
  });


});
