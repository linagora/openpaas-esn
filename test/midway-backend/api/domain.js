'use strict';

var request = require('supertest'),
    expect = require('chai').expect,
    sinon = require('sinon'),
    ObjectId = require('bson').ObjectId;


describe('The domain API', function() {
  var app;
  var user1Domain1Manager, user2Domain1Member;
  var user1Domain2Manager;
  var domain1;
  var domain1Users;
  var password = 'secret';
  var Domain;
  var Invitation;
  var pubsubLocal;

  beforeEach(function(done) {
    var self = this;
    this.mongoose = require('mongoose');
    this.testEnv.initCore(function() {
      app = self.helpers.requireBackend('webserver/application');
      Domain = self.helpers.requireBackend('core/db/mongo/models/domain');
      Invitation = self.helpers.requireBackend('core/db/mongo/models/invitation');
      pubsubLocal = self.helpers.requireBackend('core/pubsub').local;

      self.helpers.api.applyDomainDeployment('linagora_test_domain', function(err, models) {
        expect(err).to.not.exist;
        user1Domain1Manager = models.users[0];
        user2Domain1Member = models.users[1];
        domain1 = models.domain;
        domain1Users = models.users.map(function(user) {
          return self.helpers.toComparableObject(user);
        });

        self.helpers.api.applyDomainDeployment('linagora_test_domain2', function(err, models2) {
          expect(err).to.not.exist;
          user1Domain2Manager = models2.users[0];

          self.helpers.elasticsearch.saveTestConfiguration(self.helpers.callbacks.noError(done));
        });
      });
    });
  });

  afterEach(function(done) {
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });

  describe('POST /api/domains', function() {
    it('should send back 400 when administrator is not set', function(done) {
      var json = {
        name: 'Marketing',
        company_name: 'Corporate'
      };

      request(app).post('/api/domains').send(json).expect(400).end(this.helpers.callbacks.noError(done));
    });

    it('should send back 400 when administrator user is not correctly filled (emails is mandatory)', function(done) {
      var user = {
        firstname: 'foo',
        lastname: 'bar'
      };

      var json = {
        name: 'Marketing',
        company_name: 'Corporate',
        administrator: user
      };

      request(app).post('/api/domains').send(json).expect(400).end(this.helpers.callbacks.noError(done));
    });

    it('should send back 201, create a domain with name, company_name and administrator in lower case', function(done) {
      var user = {
        firstname: 'foo',
        lastname: 'bar',
        accounts: [{
          type: 'email',
          emails: ['foo@linagora.com']
        }]
      };

      var json = {
        name: 'Marketing',
        company_name: 'Corporate',
        administrator: user
      };

      request(app).post('/api/domains').send(json).expect(201).end(function(err, res) {
        expect(err).to.not.exist;
        expect(res.body).to.exists;
        expect(res.body).to.be.empty;
        Domain.findOne({name: 'marketing', company_name: 'corporate'}, function(err, doc) {
          expect(err).to.not.exist;
          expect(doc).to.exist;
          expect(doc).to.shallowDeepEqual({name: 'marketing', company_name: 'corporate'});
          done();
        });
      });
    });
  });

  describe('GET /api/domains/:uuid', function() {
    it('should send back 401 when not logged in', function(done) {
      this.helpers.api.requireLogin(app, 'get', '/api/domains/' + domain1._id, done);
    });

    it('should send back 403 when current user is not domain member', function(done) {
      this.helpers.api.loginAsUser(app, user1Domain2Manager.emails[0], password, function(err, loggedInAsUser) {
        expect(err).to.not.exist;
        loggedInAsUser(request(app).get('/api/domains/' + domain1._id)).expect(403).end(done);
      });
    });

    it('should send back 200 with domain information when current user is domain manager', function(done) {
      this.helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, loggedInAsUser) {
        expect(err).to.not.exist;
        loggedInAsUser(request(app).get('/api/domains/' + domain1._id)).expect(200).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.body).to.shallowDeepEqual({name: domain1.name, company_name: domain1.company_name});
          done();
        });
      });
    });

    it('should send back 200 with domain information when current user is domain member', function(done) {
      this.helpers.api.loginAsUser(app, user2Domain1Member.emails[0], password, function(err, loggedInAsUser) {
        expect(err).to.not.exist;
        loggedInAsUser(request(app).get('/api/domains/' + domain1._id)).expect(200).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.body).to.shallowDeepEqual({name: domain1.name, company_name: domain1.company_name});
          done();
        });
      });
    });
  });

  describe('GET /api/domains/:uuid/members', function() {
    it('should send back 401 when not logged in', function(done) {
      this.helpers.api.requireLogin(app, 'get', '/api/domains/' + domain1._id + '/members', done);
    });

    it('should send back 404 when domain is not found', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        var req = requestAsMember(request(app).get('/api/domains/' + new ObjectId() + '/members'));
        req.expect(404).end(self.helpers.callbacks.noError(done));
      });
    });

    it('should send back 200 with all the members of the domain and contain the list size in the header', function(done) {
      this.helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        var req = requestAsMember(request(app).get('/api/domains/' + domain1._id + '/members'));
        req.expect(200).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.headers['x-esn-items-count']).to.exist;
          expect(res.headers['x-esn-items-count']).to.equal(domain1Users.length + '');
          expect(res.body).to.shallowDeepEqual(domain1Users);
          done();
        });
      });
    });

    it('should send back 200 with all the members matching the search terms', function(done) {
      var self = this;

      var ids = domain1Users.map(function(user) {
        return user._id;
      });
      self.helpers.elasticsearch.checkUsersDocumentsIndexed(ids, function(err) {
        expect(err).to.not.exist;

        self.helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
          expect(err).to.not.exist;
          var req = requestAsMember(request(app).get('/api/domains/' + domain1._id + '/members'));
          req.query({search: 'lng'}).expect(200).end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            var expectedUsers = domain1Users.slice(0, 3);
            expect(res.headers['x-esn-items-count']).to.exist;
            expect(res.headers['x-esn-items-count']).to.equal(expectedUsers.length + '');
            expect(res.body).to.shallowDeepEqual(expectedUsers);
            done();
          });
        });
      });
    });

    it('should send back 200 with the first 2 members', function(done) {
      this.helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        var req = requestAsMember(request(app).get('/api/domains/' + domain1._id + '/members'));
        req.query({limit: 2}).expect(200).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.headers['x-esn-items-count']).to.exist;
          expect(res.headers['x-esn-items-count']).to.equal(domain1Users.length + '');
          var expectedUsers = domain1Users.slice(0, 2);
          expect(res.body).to.shallowDeepEqual(expectedUsers);
          done();
        });
      });
    });

    it('should send back 200 with the last 2 members', function(done) {
      this.helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        var req = requestAsMember(request(app).get('/api/domains/' + domain1._id + '/members'));
        req.query({offset: 2}).expect(200).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.headers['x-esn-items-count']).to.exist;
          expect(res.headers['x-esn-items-count']).to.equal(domain1Users.length + '');
          var expectedUsers = domain1Users.slice(2, 4);
          expect(res.body).to.shallowDeepEqual(expectedUsers);
          done();
        });
      });
    });

    it('should send back 200 with the third member', function(done) {
      this.helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        var req = requestAsMember(request(app).get('/api/domains/' + domain1._id + '/members'));
        req.query({limit: 1, offset: 2}).expect(200).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.headers['x-esn-items-count']).to.exist;
          expect(res.headers['x-esn-items-count']).to.equal(domain1Users.length + '');
          var expectedUsers = domain1Users.slice(2, 3);
          expect(res.body).to.shallowDeepEqual(expectedUsers);
          done();
        });
      });
    });
  });

  describe('POST /api/domains/:uuid/invitations', function() {
    beforeEach(function(done) {
      this.helpers.mail.saveTestConfiguration(done);
    });

    it('should send back 401 when not logged in', function(done) {
      this.helpers.api.requireLogin(app, 'post', '/api/domains/' + domain1._id + '/invitations', done);
    });

    it('should send back 202 when current user is a domain member', function(done) {
      var checkpoint = sinon.spy();

      pubsubLocal.topic('domain:invitations:sent').subscribe(function(message) {
        expect(checkpoint).to.have.been.called;
        var expectedMessage = {
          user: user2Domain1Member._id,
          domain: domain1._id,
          emails: ['foo@bar.com']
        };
        expect(message).to.shallowDeepEqual(expectedMessage);
        done();
      });

      this.helpers.api.loginAsUser(app, user2Domain1Member.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        var req = requestAsMember(request(app).post('/api/domains/' + domain1._id + '/invitations'));
        req.send(['foo@bar.com']).expect(202).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exists;
          expect(res.body).to.be.empty;
          Invitation.find({}, function(err, docs) {
            expect(err).to.not.exist;
            expect(docs).to.exist;
            expect(docs).to.have.length(1);
            var expectedObject = {
              type: 'addmember',
              data: {
                user: user2Domain1Member.toObject(),
                domain: domain1.toObject()
              }
            };
            expect(docs[0]).to.shallowDeepEqual(expectedObject);
            checkpoint();
          });
        });
      });
    });

    it('should send back 403 when current user is not a domain member', function(done) {
      this.helpers.api.loginAsUser(app, user1Domain2Manager.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        var req = requestAsMember(request(app).post('/api/domains/' + domain1._id + '/invitations'));
        req.send(['inviteme@open-paas.org']).expect(403).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exists;
          expect(res.body.error).to.equal(403);
          done();
        });
      });
    });
  });

  describe('GET /api/domains/:uuid/manager', function() {
    it('should send back 401 when not logged in', function(done) {
      this.helpers.api.requireLogin(app, 'get', '/api/domains/' + domain1._id + '/manager', done);
    });

    it('should send back 403 when current user is not a domain manager', function(done) {
      this.helpers.api.loginAsUser(app, user2Domain1Member.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        var req = requestAsMember(request(app).get('/api/domains/' + domain1._id + '/manager'));
        req.expect(403).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exists;
          expect(res.body.error).to.equal(403);
          done();
        });
      });
    });

    it('should send back 200 with the domain information when current user is a domain manager', function(done) {
      this.helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        var req = requestAsMember(request(app).get('/api/domains/' + domain1._id + '/manager'));
        req.expect(200).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exists;
          expect(res.body).to.shallowDeepEqual({name: domain1.name, company_name: domain1.company_name});
          done();
        });
      });
    });
  });

});
