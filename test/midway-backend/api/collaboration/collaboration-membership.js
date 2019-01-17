'use strict';

var expect = require('chai').expect;
var request = require('supertest');
var async = require('async');

describe('The collaborations membership API', function() {

  var email = 'user@open-paas.org', password = 'secret';
  var user, Community, User, Domain, webserver, helpers, fixtures;

  function saveEntity(Model, entity, done) {
    new Model(entity).save(helpers.callbacks.noErrorAnd(function(saved) {
      entity._id = saved._id;
      done();
    }));
  }

  function saveCommunity(community, done) { saveEntity(Community, community, done); }
  function saveDomain(domain, done) { saveEntity(Domain, domain, done); }
  function saveUser(user, done) { saveEntity(User, user, done); }

  beforeEach(function(done) {
    var self = this;

    helpers = this.helpers;
    this.mongoose = require('mongoose');
    this.testEnv.initCore(function() {
      webserver = self.helpers.requireBackend('webserver').webserver;
      Community = self.helpers.requireBackend('core/db/mongo/models/community');
      User = self.helpers.requireBackend('core/db/mongo/models/user');
      Domain = self.helpers.requireBackend('core/db/mongo/models/domain');
      fixtures = helpers.requireFixture('models/users.js')(User);

      saveUser(user = fixtures.newDummyUser([email], password), done);
    });
  });

  afterEach(function(done) {
    this.helpers.mongo.dropDatabase(done);
  });

  describe('PUT /api/collaborations/:objectType/:id/membership/:user_id', function() {

    it('should return 401 if user is not authenticated', function(done) {
      this.helpers.api.requireLogin(webserver.application, 'put', '/api/collaborations/community/123/membership/456', done);
    });

    it('should return 400 if user is already member of the community', function(done) {
      var self = this;
      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { return done(err); }
        var community = models.communities[1];

        self.helpers.api.loginAsUser(webserver.application, models.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(request(webserver.application).put('/api/collaborations/community/' + community._id + '/membership/' + models.users[1]._id));
          req.expect(400);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.text).to.contain('already member');
            done();
          });
        });
      });
    });

    it('should return 200 if user has already made a request for this community', function(done) {
      var self = this;
      var community = {
        title: 'Node.js',
        description: 'This is the community description',
        members: [],
        type: 'private',
        membershipRequests: []
      };
      var domain = {
        name: 'MyDomain',
        company_name: 'MyAwesomeCompany'
      };

      async.series([
        function(callback) {
          domain.administrators = [{ user_id: user._id }];
          saveDomain(domain, callback);
        },
        function(callback) {
          community.creator = user._id;
          community.domain_ids = [domain._id];
          community.membershipRequests.push({user: user._id, workflow: 'workflow'});
          saveCommunity(community, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).put('/api/collaborations/community/' + community._id + '/membership/' + user._id));
            req.end(function(err, res) {
              expect(res.status).to.equal(200);
              expect(res.body.membershipRequest).to.exist;
              expect(res.body.membershipRequests).to.not.exist;
              done();
            });
          });
        }
      ], function(err) {
        if (err) {
          return done(err);
        }
      });
    });

    describe('when the current user is not a community manager', function() {
      it('should return 403 if current user is not equal to :user_id param', function(done) {
        var self = this;
        this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
          if (err) { return done(err); }
          var community = models.communities[1];

          self.helpers.api.loginAsUser(webserver.application, models.users[2].emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).put('/api/collaborations/community/' + community._id + '/membership/' + models.users[3]._id));
            req.expect(403);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      it('should return 200 with the community containing a new request', function(done) {
        var self = this;
        var community = {
          title: 'Node.js',
          description: 'This is the community description',
          members: [],
          type: 'private',
          membershipRequests: []
        };
        var domain = {
          name: 'MyDomain',
          company_name: 'MyAwesomeCompany'
        };

        async.series([
          function(callback) {
            domain.administrators = [{ user_id: user._id }];
            saveDomain(domain, callback);
          },
          function(callback) {
            community.creator = user._id;
            community.domain_ids = [domain._id];
            saveCommunity(community, callback);
          },
          function() {
            self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
              if (err) {
                return done(err);
              }
              var req = loggedInAsUser(request(webserver.application).put('/api/collaborations/community/' + community._id + '/membership/' + user._id));
              req.end(function(err, res) {
                expect(res.status).to.equal(200);
                expect(res.body).to.exist;
                expect(res.body.title).to.equal(community.title);
                expect(res.body.description).to.equal(community.description);
                expect(res.body.type).to.equal(community.type);
                expect(res.body.membershipRequest).to.exist;
                expect(res.body.membershipRequests).to.not.exist;
                done();
              });
            });
          }
        ], function(err) {
          if (err) {
            return done(err);
          }
        });
      });
    });

    describe('when the current user is a community manager', function() {
      it('should return 200 with the community containing a new invitation', function(done) {
        var self = this;
        this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
          if (err) { return done(err); }
          var community = models.communities[1];
          self.helpers.api.loginAsUser(webserver.application, models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).put('/api/collaborations/community/' + community._id + '/membership/' + models.users[2]._id));
            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              Community.findOne({_id: community._id}, function(err, document) {
                expect(document.membershipRequests).to.exist;
                expect(document.membershipRequests).to.be.an('array');
                expect(document.membershipRequests).to.have.length(1);
                expect(document.membershipRequests[0].user + '').to.equal(models.users[2].id);
                expect(document.membershipRequests[0].workflow).to.equal('invitation');
                done();
              });
            });
          });
        });
      });
    });
  });

  describe('GET /api/collaborations/:objectType/:id/membership', function() {

    it('should return 401 if user is not authenticated', function(done) {
      this.helpers.api.requireLogin(webserver.application, 'get', '/api/collaborations/community/123/membership', done);
    });

    it('should return 404 if community does not exist', function(done) {
      var ObjectId = require('bson').ObjectId;
      var id = new ObjectId();

      this.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + id + '/membership'));
        req.expect(404);
        req.end(function(err) {
          expect(err).to.not.exist;
          done();
        });
      });
    });

    describe('When not community manager', function() {

      it('should return HTTP 403', function(done) {
        const self = this;
        const community = {
          title: 'Node.js',
          description: 'This is the community description',
          members: [],
          membershipRequests: []
        };
        const domain = {
          name: 'MyDomain',
          company_name: 'MyAwesomeCompany'
        };
        const dummyUser = fixtures.newDummyUser(['dummy@foobar.com'], 'secret');
        const domainAdmmin = fixtures.newDummyUser(['admin@foobar.com'], 'secret');

        async.series([
          callback => saveUser(dummyUser, callback),
          callback => saveUser(domainAdmmin, callback),
          callback => {
            domain.administrators = [{ user_id: domainAdmmin._id }];
            saveDomain(domain, callback);
          },
          callback => {
            community.creator = dummyUser._id;
            community.domain_ids = [domain._id];
            community.type = 'restricted';
            community.membershipRequests.push({user: user._id, workflow: 'request'});
            saveCommunity(community, callback);
          },
          () => {
            self.helpers.api.loginAsUser(webserver.application, email, password, (err, loggedInAsUser) => {
              if (err) {
                return done(err);
              }
              const req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + community._id + '/membership'));

              req.expect(403);
              req.end(done);
            });
          }
        ], err => err && done(err));
      });
    });

    describe('When community manager', function() {

      it('should return the membership request list', function(done) {
        var self = this;
        this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
          if (err) { return done(err); }
          var manager = models.users[0];
          var community = models.communities[1];
          community.membershipRequests.push({user: models.users[2]._id, workflow: 'request'});
          community.save(function(err, community) {
            if (err) {return done(err);}

            self.helpers.api.loginAsUser(webserver.application, manager.emails[0], 'secret', function(err, loggedInAsUser) {
              if (err) {
                return done(err);
              }
              var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + community._id + '/membership'));
              req.expect(200);
              req.end(function(err, res) {
                expect(err).to.not.exist;
                expect(res.body).to.be.an('array');
                expect(res.body.length).to.equal(1);
                expect(res.body[0].user).to.exist;
                expect(res.body[0].user._id).to.exist;
                expect(res.body[0].user.password).to.not.exist;
                expect(res.body[0].metadata).to.exist;
                done();
              });
            });
          });
        });
      });

      it('should return number of community membership requests in the header', function(done) {
        var self = this;
        var models;

        function launchTests(err, community) {
          self.helpers.api.loginAsUser(webserver.application, models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + community._id + '/membership'));
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.headers['x-esn-items-count']).to.equal('10');
              done();
            });
          });
        }

        this.helpers.api.applyDomainDeployment('linagora_IT', function(err, m) {
          if (err) { return done(err); }
          models = m;
          var community = models.communities[1];
          var userA = {accounts: [{ type: 'email', hosted: true, emails: ['foo.a@bar.com'] }], password: 'secret'};
          var userB = {accounts: [{ type: 'email', hosted: true, emails: ['foo.b@bar.com'] }], password: 'secret'};
          var userC = {accounts: [{ type: 'email', hosted: true, emails: ['foo.c@bar.com'] }], password: 'secret'};
          var userD = {accounts: [{ type: 'email', hosted: true, emails: ['foo.d@bar.com'] }], password: 'secret'};
          var userE = {accounts: [{ type: 'email', hosted: true, emails: ['foo.e@bar.com'] }], password: 'secret'};
          var userF = {accounts: [{ type: 'email', hosted: true, emails: ['foo.f@bar.com'] }], password: 'secret'};
          var userG = {accounts: [{ type: 'email', hosted: true, emails: ['foo.g@bar.com'] }], password: 'secret'};
          var userH = {accounts: [{ type: 'email', hosted: true, emails: ['foo.h@bar.com'] }], password: 'secret'};
          var userI = {accounts: [{ type: 'email', hosted: true, emails: ['foo.i@bar.com'] }], password: 'secret'};
          var userJ = {accounts: [{ type: 'email', hosted: true, emails: ['foo.j@bar.com'] }], password: 'secret'};

          async.parallel([
            function(callback) { saveUser(userA, callback); },
            function(callback) { saveUser(userB, callback); },
            function(callback) { saveUser(userC, callback); },
            function(callback) { saveUser(userD, callback); },
            function(callback) { saveUser(userE, callback); },
            function(callback) { saveUser(userF, callback); },
            function(callback) { saveUser(userG, callback); },
            function(callback) { saveUser(userH, callback); },
            function(callback) { saveUser(userI, callback); },
            function(callback) { saveUser(userJ, callback); }
          ], function(err) {
            if (err) { return done(err); }
            community.membershipRequests.push({user: userA._id, workflow: 'request'});
            community.membershipRequests.push({user: userB._id, workflow: 'request'});
            community.membershipRequests.push({user: userC._id, workflow: 'request'});
            community.membershipRequests.push({user: userD._id, workflow: 'request'});
            community.membershipRequests.push({user: userE._id, workflow: 'request'});
            community.membershipRequests.push({user: userF._id, workflow: 'request'});
            community.membershipRequests.push({user: userG._id, workflow: 'request'});
            community.membershipRequests.push({user: userH._id, workflow: 'request'});
            community.membershipRequests.push({user: userI._id, workflow: 'request'});
            community.membershipRequests.push({user: userJ._id, workflow: 'request'});
            community.save(launchTests);
          });
        });
      });
    });

    it('should return sliced community membership requests', function(done) {
      var self = this;
      var models;

      function launchTests(err, community) {
        self.helpers.api.loginAsUser(webserver.application, models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + community._id + '/membership'));
          req.query({limit: 3, offset: 1});
          req.expect(200);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.be.an('array');
            expect(res.body.length).to.equal(3);
            done();
          });
        });
      }

      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, m) {
        if (err) { return done(err); }
        models = m;
        var community = models.communities[1];
        var userA = {accounts: [{ type: 'email', hosted: true, emails: ['foo.a@bar.com'] }], password: 'secret'};
        var userB = {accounts: [{ type: 'email', hosted: true, emails: ['foo.b@bar.com'] }], password: 'secret'};
        var userC = {accounts: [{ type: 'email', hosted: true, emails: ['foo.c@bar.com'] }], password: 'secret'};
        var userD = {accounts: [{ type: 'email', hosted: true, emails: ['foo.d@bar.com'] }], password: 'secret'};
        var userE = {accounts: [{ type: 'email', hosted: true, emails: ['foo.e@bar.com'] }], password: 'secret'};
        var userF = {accounts: [{ type: 'email', hosted: true, emails: ['foo.f@bar.com'] }], password: 'secret'};
        var userG = {accounts: [{ type: 'email', hosted: true, emails: ['foo.g@bar.com'] }], password: 'secret'};
        var userH = {accounts: [{ type: 'email', hosted: true, emails: ['foo.h@bar.com'] }], password: 'secret'};
        var userI = {accounts: [{ type: 'email', hosted: true, emails: ['foo.i@bar.com'] }], password: 'secret'};
        var userJ = {accounts: [{ type: 'email', hosted: true, emails: ['foo.j@bar.com'] }], password: 'secret'};

        async.parallel([
          function(callback) { saveUser(userA, callback); },
          function(callback) { saveUser(userB, callback); },
          function(callback) { saveUser(userC, callback); },
          function(callback) { saveUser(userD, callback); },
          function(callback) { saveUser(userE, callback); },
          function(callback) { saveUser(userF, callback); },
          function(callback) { saveUser(userG, callback); },
          function(callback) { saveUser(userH, callback); },
          function(callback) { saveUser(userI, callback); },
          function(callback) { saveUser(userJ, callback); }
        ], function(err) {
          if (err) { return done(err); }
          community.membershipRequests.push({user: userA._id, workflow: 'request'});
          community.membershipRequests.push({user: userB._id, workflow: 'request'});
          community.membershipRequests.push({user: userC._id, workflow: 'request'});
          community.membershipRequests.push({user: userD._id, workflow: 'request'});
          community.membershipRequests.push({user: userE._id, workflow: 'request'});
          community.membershipRequests.push({user: userF._id, workflow: 'request'});
          community.membershipRequests.push({user: userG._id, workflow: 'request'});
          community.membershipRequests.push({user: userH._id, workflow: 'request'});
          community.membershipRequests.push({user: userI._id, workflow: 'request'});
          community.membershipRequests.push({user: userJ._id, workflow: 'request'});
          community.save(launchTests);
        });
      });
    });
  });

  describe('DELETE /api/collaborations/community/:id/membership/:user_id', function() {

    beforeEach(function(done) {
      var self = this;
      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { done(err); }
        self.domain = models.domain;
        self.admin = models.users[0];
        self.jdoe = models.users[1];
        self.jdee = models.users[1];
        self.kcobain = models.users[2];
        self.jhendrix = models.users[3];
        self.membershipRequests = [{
          user: self.jdee._id,
          workflow: 'invitation',
          timestamp: {
            creation: new Date(1419509532000)
          }
        },
          {
            user: self.kcobain._id,
            workflow: 'request',
            timestamp: {
              creation: new Date(1419509532000)
            }
          }];

        self.helpers.api.createCommunity(
          'Node',
          self.admin,
          self.domain,
          {membershipRequests: self.membershipRequests, type: 'restricted'},
          function(err, saved) {
            if (err) { return done(err); }
            self.community = saved;
            done();
          }
        );
      });
    });

    it('should return 401 if user is not authenticated', function(done) {
      this.helpers.api.requireLogin(webserver.application, 'delete', '/api/collaborations/community/123/membership/456', done);
    });

    describe('when current user is not community manager', function() {

      it('should return 403 if current user is not the target user', function(done) {
        var self = this;
        self.helpers.api.loginAsUser(webserver.application, self.jhendrix.emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(
            request(webserver.application).delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.jdee._id)
          );
          req.end(function(err, res) {
            expect(res.status).to.equal(403);
            expect(res.text).to.match(/Current user is not the target user/);
            done();
          });
        });
      });

      it('should return 204 with the community having no more membership requests', function(done) {
        var self = this;
        self.community.membershipRequests = [];
        self.community.save(function(err) {
          if (err) { return done(err); }
          self.helpers.api.loginAsUser(webserver.application, self.jhendrix.emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(
              request(webserver.application).delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.jhendrix._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
              done();
            });
          });
        });
      });

      it('should return 204 even if the community had no membership request for this user', function(done) {
        var self = this;
        self.helpers.api.loginAsUser(webserver.application, self.jhendrix.emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) { return done(err); }
          var req = loggedInAsUser(
            request(webserver.application).delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.jhendrix._id)
          );
          req.end(function(err, res) {
            expect(res.status).to.equal(204);
            done();
          });
        });
      });

      describe('when the workflow is invitation', function() {
        it('should return 204 and remove the membershipRequest of the community', function(done) {
          var self = this;
          self.helpers.api.loginAsUser(webserver.application, self.jdee.emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(
              request(webserver.application).delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.jdee._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
              self.helpers.api.getCommunity(self.community._id, function(err, community) {
                if (err) {return done(err);}
                var requests = community.membershipRequests.filter(function(mr) {
                  return mr.user.equals(self.jdee._id);
                });
                expect(requests).to.have.length(0);
                done();
              });
            });
          });
        });

        it('should publish a message in collaboration:membership:invitation:decline topic', function(done) {
          var self = this;
          var pubsub = this.helpers.requireBackend('core').pubsub.local,
            topic = pubsub.topic('collaboration:membership:invitation:decline');
          topic.subscribe(function(message) {
            expect(self.jdee._id.equals(message.author)).to.be.true;
            expect(self.community._id.equals(message.target)).to.be.true;
            expect(self.community._id.equals(message.collaboration.id)).to.be.true;
            done();
          });

          self.helpers.api.loginAsUser(webserver.application, self.jdee.emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(
              request(webserver.application).delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.jdee._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
            });
          });
        });

      });

      describe('when the workflow is request', function() {
        it('should return 204 and remove the membershipRequest of the community', function(done) {
          var self = this;
          self.helpers.api.loginAsUser(webserver.application, self.kcobain.emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(
              request(webserver.application).delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.kcobain._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
              self.helpers.api.getCommunity(self.community._id, function(err, community) {
                if (err) {return done(err);}
                var requests = community.membershipRequests.filter(function(mr) {
                  return mr.user.equals(self.kcobain._id);
                });
                expect(requests).to.have.length(0);
                done();
              });
            });
          });
        });

        it('should publish a message in collaboration:membership:request:cancel topic', function(done) {
          var self = this;
          var pubsub = this.helpers.requireBackend('core').pubsub.local,
            topic = pubsub.topic('collaboration:membership:request:cancel');
          topic.subscribe(function(message) {
            expect(self.kcobain._id.equals(message.author)).to.be.true;
            expect(self.community._id.equals(message.target)).to.be.true;
            expect(self.community._id.equals(message.collaboration.id)).to.be.true;
            done();
          });

          self.helpers.api.loginAsUser(webserver.application, self.kcobain.emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(
              request(webserver.application).delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.kcobain._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
            });
          });
        });
      });

    });

    describe('when current user is community manager', function() {

      describe('and target user does not have membershipRequests', function() {
        it('should return 204, and let the membershipRequests array unchanged', function(done) {
          var self = this;
          self.helpers.api.loginAsUser(webserver.application, self.admin.emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(
              request(webserver.application).delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.jhendrix._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
              self.helpers.api.getCommunity(self.community._id, function(err, community) {
                if (err) {return done(err);}
                expect(community.membershipRequests).to.have.length(2);
                done();
              });
            });
          });
        });
      });

      describe('and workflow = invitation', function() {

        it('should return 204 and remove the membershipRequest of the community', function(done) {
          var self = this;
          self.helpers.api.loginAsUser(webserver.application, self.admin.emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(
              request(webserver.application).delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.jdee._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
              self.helpers.api.getCommunity(self.community._id, function(err, community) {
                if (err) {return done(err);}
                var requests = community.membershipRequests.filter(function(mr) {
                  return mr.user.equals(self.jdee._id);
                });
                expect(requests).to.have.length(0);
                done();
              });
            });
          });
        });

        it('should publish a message in collaboration:membership:invitation:cancel topic', function(done) {
          var self = this;
          var pubsub = this.helpers.requireBackend('core').pubsub.local,
            topic = pubsub.topic('collaboration:membership:invitation:cancel');
          topic.subscribe(function(message) {
            expect(self.admin._id.equals(message.author)).to.be.true;
            expect(self.jdee._id.equals(message.target)).to.be.true;
            expect(self.community._id.equals(message.collaboration.id)).to.be.true;
            done();
          });

          self.helpers.api.loginAsUser(webserver.application, self.admin.emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(
              request(webserver.application).delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.jdee._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
            });
          });
        });

      });

      describe('and workflow = request', function() {

        it('should return 204 and remove the membershipRequest of the community', function(done) {
          var self = this;
          self.helpers.api.loginAsUser(webserver.application, self.admin.emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(
              request(webserver.application).delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.kcobain._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
              self.helpers.api.getCommunity(self.community._id, function(err, community) {
                if (err) {return done(err);}
                var requests = community.membershipRequests.filter(function(mr) {
                  return mr.user.equals(self.kcobain._id);
                });
                expect(requests).to.have.length(0);
                done();
              });
            });
          });
        });

        it('should publish a message in collaboration:membership:request:refuse topic', function(done) {
          var self = this;
          var pubsub = this.helpers.requireBackend('core').pubsub.local,
            topic = pubsub.topic('collaboration:membership:request:refuse');
          topic.subscribe(function(message) {
            expect(self.admin._id.equals(message.author)).to.be.true;
            expect(self.kcobain._id.equals(message.target)).to.be.true;
            expect(self.community._id.equals(message.collaboration.id)).to.be.true;
            done();
          });

          self.helpers.api.loginAsUser(webserver.application, self.admin.emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(
              request(webserver.application).delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.kcobain._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
            });
          });
        });

      });

    });

    describe('pubsub events', function() {
      beforeEach(function(done) {
        var self = this;
        self.helpers.api.loginAsUser(webserver.application, self.admin.emails[0], 'secret', function(err, loggedInAsUser) {
          self.loggedInAsManager = loggedInAsUser;
          self.helpers.api.loginAsUser(webserver.application, self.jhendrix.emails[0], 'secret', function(err, loggedInAsUser) {
            self.loggedInAsUser = loggedInAsUser;
            done();
          });
        });
      });

      describe('when admin refuses a join request', function() {
        it('should add a usernotification for the user', function(done) {
          var self = this;
          var maxtries = 10, currenttry = 0;

          function checkusernotificationexists() {
            if (currenttry === maxtries) {
              return done(new Error('Unable to find user notification after 10 tries'));
            }
            currenttry++;

            var UN = self.mongoose.model('Usernotification');
            UN.find(
              {
                category: 'collaboration:membership:refused',
                target: self.jhendrix._id
              },
              function(err, notifs) {
                if (err) { return done(err); }
                if (!notifs.length) {
                  checkusernotificationexists();
                  return;
                }
                return done(null, notifs[0]);
              }
            );
          }

          var req = self.loggedInAsUser(
            request(webserver.application)
              .put('/api/collaborations/community/' + self.community._id + '/membership/' + self.jhendrix._id)
          );
          req.end(function() {
            var req = self.loggedInAsManager(
              request(webserver.application)
                .delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.jhendrix._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
              checkusernotificationexists();
            });
          });
        });
      });

      describe('when manager cancels an invitation', function() {

        it('should remove the attendee usernotification', function(done) {
          var self = this;
          var maxtries = 10, currenttry = 0;

          function checkusernotificationexists(callback) {
            if (currenttry === maxtries) {
              return callback(new Error('Unable to find user notification after 10 tries'));
            }
            currenttry++;

            var UN = self.mongoose.model('Usernotification');
            UN.find(
              {
                category: 'collaboration:membership:invite',
                target: self.jhendrix._id
              },
              function(err, notifs) {
                if (err) { return callback(err); }
                if (!notifs.length) {
                  checkusernotificationexists(callback);
                  return;
                }
                return callback(null, notifs[0]);
              }
            );
          }

          function checkusernotificationdisappear() {
            if (currenttry === maxtries) {
              return done(new Error('Still finding user notification after 10 tries'));
            }
            currenttry++;

            var UN = self.mongoose.model('Usernotification');
            UN.find(
              {
                category: 'collaboration:membership:invite',
                target: self.jhendrix._id
              },
              function(err, notifs) {
                if (err) { return done(err); }
                if (notifs.length) {
                  checkusernotificationdisappear();
                  return;
                }
                return done();
              }
            );
          }

          var req = self.loggedInAsManager(
            request(webserver.application)
              .put('/api/collaborations/community/' + self.community._id + '/membership/' + self.jhendrix._id)
          );
          req.end(function() {
            checkusernotificationexists(function(err) {
              if (err) { return done(err); }
              var req = self.loggedInAsManager(
                request(webserver.application)
                  .delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.jhendrix._id)
              );
              req.end(function(err, res) {
                expect(res.status).to.equal(204);
                currenttry = 0;
                checkusernotificationdisappear();
              });
            });
          });
        });
      });
    });

  });
});
