'use strict';

var expect = require('chai').expect,
    request = require('supertest');

describe('The companies routes', function() {

  before(function() {
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/domain');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
  });

  beforeEach(function(done) {
    this.mongoose = require('mongoose');
    this.testEnv.initCore(done);
  });

  afterEach(function(done) {
    var mongoose = this.mongoose;
    mongoose.connection.db.dropDatabase(function() {
      mongoose.disconnect(done);
    });
  });


  describe('HEAD /api/companies', function() {
    var webserver = null;
    var Domain;
    var User, emails;

    beforeEach(function() {

      Domain = this.mongoose.model('Domain');
      User = this.mongoose.model('User');
      emails = ['foo@linagora.com', 'bar@linagora.com'];

      webserver = require(this.testEnv.basePath + '/backend/webserver').webserver;
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

    beforeEach(function() {

      Domain = this.mongoose.model('Domain');
      User = this.mongoose.model('User');
      emails = ['foo@linagora.com', 'bar@linagora.com'];

      webserver = require(this.testEnv.basePath + '/backend/webserver').webserver;
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
