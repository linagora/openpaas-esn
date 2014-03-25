'use strict';

var expect = require('chai').expect;
var request = require('supertest');

describe('The domains routes resource', function() {

  before(function() {
    this.mongoose = require('mongoose');
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

  describe('GET /api/domains/:uuid/members', function() {
    var email = 'foo@linagora.com';
    var Domain, User, webserver;

    beforeEach(function(done) {
      Domain = require(this.testEnv.basePath + '/backend/core/db/mongo/models/domain');
      User = require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
      webserver = require(this.testEnv.basePath + '/backend/webserver');
      done();
    });

    if ('should return 404 when domain is not found', function(done) {
      request(webserver.application).get('/api/domains/123456789/members').expect(404).end(done);
    });

    it('should return all the members of the domain and contain the list size in the header', function(done) {
      var d = new Domain({name: 'MyDomain', company_name: 'MyAwesomeCompany'});
      d.save(function(err, domain) {
        if (err) {
          return done(err);
        }
        var u = new User({domains: [{domain_id: domain._id}], emails: [email]});

        u.save(function(err, user) {
          if (err) {
            return done(err);
          }
          request(webserver.application).get('/api/domains/' + domain._id + '/members').expect(200).end(function(err, res) {
            expect(err).to.be.null;
            expect(res.body).to.be.not.null;
            expect(res.headers['x-esn-items-count']).to.exist;
            expect(res.headers['x-esn-items-count']).to.equal('1');
            done();
          });
        });
      });
    });
  });

  describe('GET /api/domains/', function() {
    var webserver = null;
    var Domain;
    var User;
    var emails = [];
    var email = 'foo@linagora.com';
    var email2 = 'bar@linagora.com';

    beforeEach(function() {
      Domain = require(this.testEnv.basePath + '/backend/core/db/mongo/models/domain');
      User = require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
      webserver = require(this.testEnv.basePath + '/backend/webserver');
    });

    it('should return a JSON with 404 result when domain (name, company_name) doesn\'t exist', function(done) {
      request(webserver.application).head('/api/domains/' + 'Market' + '/Corporat').expect(404).end(function(err, res) {
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
    var User;

    var emails = [];
    var email = 'foo@linagora.com';
    var email2 = 'bar@linagora.com';

    beforeEach(function() {
      Domain = require(this.testEnv.basePath + '/backend/core/db/mongo/models/domain');
      User = require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
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
