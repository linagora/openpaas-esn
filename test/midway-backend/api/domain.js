'use strict';

var request = require('supertest'),
    expect = require('chai').expect;


describe('The domain API', function() {
  var app;
  var foouser, baruser;
  var domain;
  var password = 'secret';

  beforeEach(function(done) {
    var self = this;
    this.testEnv.initCore(function() {
      app = require(self.testEnv.basePath + '/backend/webserver/application');
      self.mongoose = require('mongoose');
      var User = require(self.testEnv.basePath + '/backend/core/db/mongo/models/user');
      var Domain = require(self.testEnv.basePath + '/backend/core/db/mongo/models/domain');

      foouser = new User({
        username: 'Foo',
        password: password,
        emails: ['foo@bar.com']
      });

      baruser = new User({
        username: 'Bar',
        password: password,
        emails: ['bar@bar.com']
      });

      domain = new Domain({
        name: 'MyDomain',
        company_name: 'MyAwesomeCompany'
      });

      function saveUser(user, cb) {
        user.save(function(err, saved) {
          if (saved) {
            user._id = saved._id;
          }
          return cb(err, saved);
        });
      }

      function saveDomain(domain, user, cb) {
        domain.administrator = user;
        domain.save(function(err, saved) {
          domain._id = saved._id;
          return cb(err, saved);
        });
      }

      var async = require('async');
      async.series([
        function(callback) {
          saveUser(foouser, callback);
        },
        function(callback) {
          saveUser(baruser, callback);
        },
        function(callback) {
          saveDomain(domain, foouser, callback);
        }
      ],
      function(err) {
        done(err);
      });
    });
  });

  afterEach(function(done) {
    var User = this.mongoose.model('User');
    var Domain = this.mongoose.model('Domain');
    User.remove(function() {
      Domain.remove(done);
    });
  });

  it('should not be able to send a domain invitation without being authenticated', function(done) {
    request(app)
      .post('/api/domains/' + domain._id + '/invitations')
      .expect(401)
      .end(done);
  });

  it('should not be able to send a domain invitation without being the domain administrator', function(done) {
    request(app)
      .post('/api/login')
      .send({username: baruser.emails[0], password: password, rememberme: false})
      .expect(200)
      .end(function(err, res) {
        var cookies = res.headers['set-cookie'].pop().split(';')[0];
        var req = request(app).post('/api/domains/' + domain._id + '/invitations');
        req.cookies = cookies;
        req.expect(403).end(done);
      });
  });

  it('should be able to send a domain invitation when logged user is the domain manager', function(done) {
    request(app)
      .post('/api/login')
      .send({username: foouser.emails[0], password: password, rememberme: false})
      .expect(200)
      .end(function(err, res) {
        var cookies = res.headers['set-cookie'].pop().split(';')[0];
        var req = request(app).post('/api/domains/' + domain._id + '/invitations');
        req.cookies = cookies;
        req.send(['foo@bar.com']);
        req.expect(202).end(done);
      });
  });

  it('should be able to get a domain information when logged in', function(done) {
    request(app)
      .post('/api/login')
      .send({username: foouser.emails[0], password: password, rememberme: false})
      .expect(200)
      .end(function(err, res) {
        var cookies = res.headers['set-cookie'].pop().split(';')[0];
        var req = request(app).get('/api/domains/' + domain._id);
        req.cookies = cookies;
        req.expect(200).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.body.administrator).to.equal('' + domain.administrator);
          expect(res.body.name).to.equal(domain.name);
          expect(res.body.company_name).to.equal(domain.company_name);
          done();
        });
      });
  });
});

