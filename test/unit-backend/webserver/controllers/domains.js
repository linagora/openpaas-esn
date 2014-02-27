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
    var User, emails, email, email2;

    before(function() {
      Domain = mongoose.model('Domain');

      User = mongoose.model('User');
      emails = [];
      email = 'foo@linagora.com';
      email2 = 'bar@linagora.com';

      webserver = require(this.testEnv.basePath + '/backend/webserver');
    });

    it('should return a JSON with 404 result when company doesnt exist within domains', function(done) {
      request(webserver.application).head('/api/domains/company/' + 'Corporate').expect(404).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return a JSON with 200 result when company exists among domains', function(done) {

      emails.push(email);
      emails.push(email2);
      var u = new User({ firstname: 'foo', lastname: 'bar', emails: emails});

      var json = {name: 'Marketing', company_name: 'Corporate',
        administrator: u
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

  describe('GET /api/domains/', function() {
    var webserver = null;
    var Domain;
    var User, emails, email, email2;

    before(function() {
      Domain = mongoose.model('Domain');

      User = mongoose.model('User');
      emails = [];
      email = 'foo@linagora.com';
      email2 = 'bar@linagora.com';

      webserver = require(this.testEnv.basePath + '/backend/webserver');
    });

    it('should return a JSON with 404 result when domain (name, company_name) doesn\'t exist', function(done) {
      request(webserver.application).head('/api/domains/' + 'Marketing' + '/Corporate').expect(404).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return a JSON with 200 result domain (name, company_name) exists', function(done) {

      emails.push(email);
      emails.push(email2);
      var u = new User({ firstname: 'foo', lastname: 'bar', emails: emails});

      var json = {name: 'Marketing', company_name: 'Corporate',
        administrator: u
      };
      var i = new Domain(json);

      i.save(function(err, domain) {
        if (err) {
          return done(err);
        }

        request(webserver.application).head('/api/domains/' + domain.name + '/' + domain.company_name).expect(200).end(function(err, res) {
          expect(err).to.be.null;
          done();
        });
      });
    });
  });

  describe('POST /api/domains/createDomain/', function() {
    var webserver = null;
    var Domain;
    var User, emails, email, email2;

    before(function() {
      Domain = mongoose.model('Domain');

      User = mongoose.model('User');
      emails = [];
      email = 'foo@linagora.com';
      email2 = 'bar@linagora.com';

      webserver = require(this.testEnv.basePath + '/backend/webserver');
    });

    it('should fail when administrator is not set', function(done) {
      var json = {
        name: 'Marketing',
        company_name: 'Corporate'
      };

      request(webserver.application).post('/api/domains').send(json).expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should fail when administrator user is not correctly filled (emails is mandatory)', function(done) {

      var u = new User({ firstname: 'foo', lastname: 'bar'});

      var json = {
        name: 'Marketing',
        company_name: 'Corporate',
        administrator: u
      };

      request(webserver.application).post('/api/domains').send(json).expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should create a domain with name, company_name and administrator', function(done) {

      emails.push(email);
      emails.push(email2);
      var u = new User({ firstname: 'foo', lastname: 'bar', emails: emails});

      var json = {
        name: 'Marketing',
        company_name: 'Corporate',
        administrator: u
      };

      request(webserver.application).post('/api/domains').send(json).expect(201).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

  });

});
