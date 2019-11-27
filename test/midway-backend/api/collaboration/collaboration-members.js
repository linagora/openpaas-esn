'use strict';

var expect = require('chai').expect;
var request = require('supertest');
var async = require('async');

describe('The collaborations members API', function() {

  var email = 'user@open-paas.org', password = 'secret';
  var user, Community, User, webserver, helpers, fixtures;

  function saveEntity(Model, entity, done) {
    new Model(entity).save(helpers.callbacks.noErrorAnd(function(saved) {
      entity._id = saved._id;
      done();
    }));
  }

  function saveUser(user, done) { saveEntity(User, user, done); }

  beforeEach(function(done) {
    var self = this;

    helpers = this.helpers;
    this.mongoose = require('mongoose');
    this.testEnv.initCore(function() {
      webserver = self.helpers.requireBackend('webserver').webserver;
      Community = self.helpers.requireBackend('core/db/mongo/models/community');
      User = self.helpers.requireBackend('core/db/mongo/models/user');
      fixtures = helpers.requireFixture('models/users.js')(User);

      saveUser(user = fixtures.newDummyUser([email], password), done);
    });
  });

  afterEach(function(done) {
    this.helpers.mongo.dropDatabase(done);
  });

  describe('PUT /api/collaborations/:objectType/:id/members/:user_id', function() {

    it('should return 401 if user is not authenticated', function(done) {
      this.helpers.api.requireLogin(webserver.application, 'put', '/api/collaborations/community/123/members/456', done);
    });

    it('should return 404 if community does not exist', function(done) {
      var ObjectId = require('bson').ObjectId;
      var id = new ObjectId();

      this.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(webserver.application).put('/api/collaborations/community/' + id + '/members/123'));
        req.expect(404);
        req.end(function(err) {
          expect(err).to.not.exist;
          done();
        });
      });
    });

    describe('When current user is not community manager', function() {

      it('should return 400 if community is not open and user was not invited into the community', function(done) {
        var self = this;
        this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
          if (err) { return done(err); }
          user = models.users[3];
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).put('/api/collaborations/community/' + models.communities[1]._id + '/members/' + user._id));
            req.expect(400);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      it('should return 400 if current user is not equal to :user_id param', function(done) {
        var self = this;
        this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
          if (err) { return done(err); }
          user = models.users[3];
          self.helpers.api.loginAsUser(webserver.application, models.users[2].emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).put('/api/collaborations/community/' + models.communities[0]._id + '/members/' + user._id));
            req.expect(400);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      it('should add the current user as member if community is open', function(done) {
        var self = this;
        this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
          if (err) { return done(err); }
          user = models.users[3];
          self.helpers.api.loginAsUser(webserver.application, models.users[2].emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).put('/api/collaborations/community/' + models.communities[0]._id + '/members/' + models.users[2]._id));
            req.expect(204);
            req.end(function(err) {
              expect(err).to.not.exist;
              Community.find({_id: models.communities[0]._id, 'members.member.id': models.users[2]._id}, function(err, document) {
                if (err) { return done(err); }
                expect(document).to.exist;
                done();
              });
            });
          });
        });
      });

      it('should not add the current user as member if already in', function(done) {
        var self = this;
        this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
          if (err) { return done(err); }
          self.helpers.api.loginAsUser(webserver.application, models.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).put('/api/collaborations/community/' + models.communities[0]._id + '/members/' + models.users[1]._id));
            req.expect(204);
            req.end(function(err) {
              expect(err).to.not.exist;
              Community.find({_id: models.communities[0]._id}, function(err, document) {
                if (err) { return done(err); }
                expect(document[0].members.length).to.equal(2);
                done();
              });
            });
          });
        });
      });

      it('should add the user to community if the community is not open but the user was invited', function(done) {
        var self = this;
        this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
          if (err) { return done(err); }
          var community = models.communities[1];
          community.membershipRequests.push({user: models.users[2]._id, workflow: 'invitation'});
          community.save(function(err, community) {
            if (err) {return done(err);}

            self.helpers.api.loginAsUser(webserver.application, models.users[2].emails[0], 'secret', function(err, loggedInAsUser) {
              if (err) {
                return done(err);
              }
              var req = loggedInAsUser(request(webserver.application).put('/api/collaborations/community/' + community._id + '/members/' + models.users[2]._id));
              req.expect(204);
              req.end(function(err) {
                expect(err).to.not.exist;
                done();
              });
            });
          });
        });
      });
    });

    describe('When current user is community manager', function() {

      it('should send back 400 when trying to add himself', function(done) {
        var self = this;
        this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
          if (err) { return done(err); }
          var community = models.communities[1];
          var manager = models.users[0];

          self.helpers.api.loginAsUser(webserver.application, manager.emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).put('/api/collaborations/community/' + community._id + '/members/' + manager._id));
            req.expect(400);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      it('should send back 400 when trying to add a user who does not asked for membership', function(done) {
        var self = this;
        this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
          if (err) { return done(err); }
          var community = models.communities[1];
          var manager = models.users[0];

          self.helpers.api.loginAsUser(webserver.application, manager.emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).put('/api/collaborations/community/' + community._id + '/members/' + models.users[2]._id));
            req.expect(400);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      it('should send back 204 when domain admin trying to add himself to the community', function(done) {
        const self = this;

        self.helpers.api.applyDomainDeployment('linagora_IT', (err, models) => {
          if (err) return done(err);

          const community = models.communities[1];
          const domainAdmin = models.users[0];
          const communityCreator = models.users[1];

          community.creator = communityCreator._id;
          community.membershipRequests.push({user: domainAdmin._id, workflow: 'request'});

          community.save((err, community) => {
            if (err) return done(err);

            self.helpers.api.loginAsUser(webserver.application, domainAdmin.emails[0], 'secret', (err, loggedInAsUser) => {
              if (err) return done(err);

              const req = loggedInAsUser(request(webserver.application).put('/api/collaborations/community/' + community._id + '/members/' + domainAdmin._id));

              req.expect(204).end(err => {
                expect(err).to.not.exist;
                done();
              });
            });
          });
        });
      });

      it('should send back 204 when user is added to members', function(done) {
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
              var req = loggedInAsUser(request(webserver.application).put('/api/collaborations/community/' + community._id + '/members/' + models.users[2]._id));
              req.expect(204);
              req.end(function(err) {
                expect(err).to.not.exist;
                done();
              });
            });
          });
        });
      });

      it('should send back 204 if the withoutInvite query parameter is true (even with no membership request)', function(done) {
        var self = this;
        this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
          if (err) { return done(err); }
          var manager = models.users[0];
          var community = models.communities[1];
          self.helpers.api.loginAsUser(webserver.application, manager.emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).put('/api/collaborations/community/' + community._id + '/members/' + models.users[2]._id + '?withoutInvite=true'));
            req.expect(204);
            req.end(function(err) {
              expect(err).to.not.exist;
              Community.findById(community._id, function(err, com) {
                expect(err).to.not.exist;
                expect(com.members.length).to.equal(3);
                done();
              });
            });
          });
        });
      });
    });
  });

  describe('GET /api/collaborations/:objectType/:id/members', function() {

    it('should return 401 if user is not authenticated', function(done) {
      this.helpers.api.requireLogin(webserver.application, 'get', '/api/collaborations/community/123/members', done);
    });

    it('should return 500 if objectType is invalid', function(done) {
      var self = this;

      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { return done(err); }
        self.helpers.api.loginAsUser(webserver.application, models.users[0].emails[0], password, function(err, loggedInAsUser) {
          if (err) { return done(err); }
          var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/badone/123456/members'));
          req.expect(500);
          req.end(function(err, res) {
            expect(res.error).to.exist;
            done();
          });
        });
      });

    });

    describe('access rights and communities', function() {

      beforeEach(function(done) {
        var self = this;
        var user, domain;
        this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
          if (err) { return done(err); }
          self.models = models;
          domain = models.domain;
          user = models.users[0];
          var member = {member: {id: models.users[1]._id, objectType: 'user'}};
          function patchCommunity(type) {
            return function(json) {
              json.type = type;
              json.members.push(member);
              return json;
            };
          }

          async.series([
            function(callback) {
              self.helpers.api.createCommunity('Open', user, domain, patchCommunity('open'), callback);
            },
            function(callback) {
              self.helpers.api.createCommunity('Restricted', user, domain, patchCommunity('restricted'), callback);
            },
            function(callback) {
              self.helpers.api.createCommunity('Private', user, domain, patchCommunity('private'), callback);
            },
            function(callback) {
              self.helpers.api.createCommunity('Confidential', user, domain, patchCommunity('confidential'), callback);
            }
          ], function(err, communities) {
            if (err) { return done(err); }
            self.communities = communities;
            done();
          });
        });
      });

      describe('open communities', function() {

        beforeEach(function() {
          this.com = this.communities[0];
          this.creator = this.models.users[0].emails[0];
          this.member = this.models.users[1].emails[0];
          this.nonMember = this.models.users[2].emails[0];
        });

        it('should return 200 if user is not a member', function(done) {
          var self = this;
          this.helpers.api.loginAsUser(webserver.application, this.nonMember, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + self.com._id + '/members'));
            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });

        it('should return 200 if user is a member', function(done) {
          var self = this;
          this.helpers.api.loginAsUser(webserver.application, this.member, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + self.com._id + '/members'));
            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      describe('restricted communities', function() {

        beforeEach(function() {
          this.com = this.communities[1];
          this.creator = this.models.users[0].emails[0];
          this.member = this.models.users[1].emails[0];
          this.nonMember = this.models.users[2].emails[0];
        });

        it('should return 200 if user is not a member', function(done) {
          var self = this;
          this.helpers.api.loginAsUser(webserver.application, this.nonMember, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + self.com._id + '/members'));
            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });

        it('should return 200 if user is a member', function(done) {
          var self = this;
          this.helpers.api.loginAsUser(webserver.application, this.member, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + self.com._id + '/members'));
            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      describe('private communities', function() {

        beforeEach(function() {
          this.com = this.communities[2];
          this.creator = this.models.users[0].emails[0];
          this.member = this.models.users[1].emails[0];
          this.nonMember = this.models.users[2].emails[0];
        });

        it('should return 403 if user is not a member', function(done) {
          var self = this;
          this.helpers.api.loginAsUser(webserver.application, this.nonMember, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + self.com._id + '/members'));
            req.expect(403);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });

        it('should return 200 if user is a member', function(done) {
          var self = this;
          this.helpers.api.loginAsUser(webserver.application, this.member, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + self.com._id + '/members'));
            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      describe('confidential communities', function() {

        beforeEach(function() {
          this.com = this.communities[3];
          this.creator = this.models.users[0].emails[0];
          this.member = this.models.users[1].emails[0];
          this.nonMember = this.models.users[2].emails[0];
        });

        it('should return 403 if user is not a member', function(done) {
          var self = this;
          this.helpers.api.loginAsUser(webserver.application, this.nonMember, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + self.com._id + '/members'));
            req.expect(403);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });

        it('should return 200 if user is a member', function(done) {
          var self = this;
          this.helpers.api.loginAsUser(webserver.application, this.member, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + self.com._id + '/members'));
            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });
    });

    it('should return 404 if community does not exist', function(done) {
      var ObjectId = require('bson').ObjectId;
      var id = new ObjectId();
      var self = this;

      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { return done(err); }
        self.helpers.api.loginAsUser(webserver.application, models.users[0].emails[0], password, function(err, loggedInAsUser) {
          if (err) { return done(err); }

          var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + id + '/members'));
          req.expect(404);
          req.end(function(err) {
            expect(err).to.not.exist;
            done();
          });
        });
      });
    });

    it('should return the members list', function(done) {
      var self = this;
      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { return done(err); }
        self.helpers.api.loginAsUser(webserver.application, models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) { return done(err); }
          var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + models.communities[0]._id + '/members'));
          req.expect(200);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.be.an.array;
            expect(res.body.length).to.equal(2);
            expect(res.body[0].user).to.exist;
            expect(res.body[0].user._id).to.exist;
            expect(res.body[0].user.password).to.not.exist;
            expect(res.body[0].metadata).to.exist;
            done();
          });
        });
      });
    });

    it('should return the filtered members list', function(done) {
      var self = this;
      this.helpers.api.applyDomainDeployment('collaborationMembers', function(err, models) {
        if (err) { return done(err); }
        self.helpers.api.loginAsUser(webserver.application, models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) { return done(err); }
          var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + models.communities[4]._id + '/members?objectTypeFilter=user&limit=1'));
          req.expect(200);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.be.an.array;
            expect(res.body.length).to.equal(1);
            expect(res.headers['x-esn-items-count']).to.equal('3');
            done();
          });
        });
      });
    });

    it('should return the inverse filtered members list', function(done) {
      var self = this;
      this.helpers.api.applyDomainDeployment('collaborationMembers', function(err, models) {
        if (err) { return done(err); }
        self.helpers.api.loginAsUser(webserver.application, models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) { return done(err); }
          var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + models.communities[4]._id + '/members?objectTypeFilter=!user&limit=1'));
          req.expect(200);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.be.an.array;
            expect(res.body.length).to.equal(1);
            expect(res.body[0].objectType).to.equal('community');
            expect(res.headers['x-esn-items-count']).to.equal('1');
            done();
          });
        });
      });
    });

    it('should return the member list filtered by id', function(done) {
      const self = this;

      this.helpers.api.applyDomainDeployment('collaborationMembers', (err, models) => {
        expect(err).to.not.exist;

        self.helpers.api.loginAsUser(webserver.application, models.users[0].emails[0], 'secret', (err, loggedInAsUser) => {
          expect(err).to.not.exist;

          const collaborationId = models.communities[4]._id;
          const member = models.communities[4].members[0].member;

          loggedInAsUser(request(webserver.application).get(`/api/collaborations/community/${collaborationId}/members?idFilter=${member.id}`))
            .expect(200)
            .end((err, res) => {
              expect(err).to.not.exist;
              expect(res.body).to.be.an.array;
              expect(res.body.length).to.equal(1);
              expect(res.body[0].objectType).to.equal(member.objectType);
              expect(res.body[0].id).to.equal(String(member.id));
              expect(res.headers['x-esn-items-count']).to.equal('1');
              done();
            });
        });
      });
    });

    it('should return the sliced members list', function(done) {
      var self = this;
      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { return done(err); }
        models.communities[0].members.push({member: {id: self.mongoose.Types.ObjectId(), objectType: 'user'}});
        models.communities[0].members.push({member: {id: self.mongoose.Types.ObjectId(), objectType: 'user'}});
        models.communities[0].members.push({member: {id: self.mongoose.Types.ObjectId(), objectType: 'user'}});
        models.communities[0].members.push({member: {id: self.mongoose.Types.ObjectId(), objectType: 'user'}});
        models.communities[0].save(function() {
          self.helpers.api.loginAsUser(webserver.application, models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + models.communities[0]._id + '/members'));
            req.query({limit: 3, offset: 1});
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.body).to.be.an.array;
              expect(res.body.length).to.equal(3);
              done();
            });
          });
        });
      });
    });

    it('should return number of community members in the header', function(done) {
      var self = this;
      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { return done(err); }
        models.communities[0].members.push({member: {id: self.mongoose.Types.ObjectId(), objectType: 'user'}});
        models.communities[0].members.push({member: {id: self.mongoose.Types.ObjectId(), objectType: 'user'}});
        models.communities[0].members.push({member: {id: self.mongoose.Types.ObjectId(), objectType: 'user'}});
        models.communities[0].members.push({member: {id: self.mongoose.Types.ObjectId(), objectType: 'user'}});
        models.communities[0].save(function() {
          self.helpers.api.loginAsUser(webserver.application, models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + models.communities[0]._id + '/members'));
            req.query({limit: 3, offset: 1});
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.headers['x-esn-items-count']).to.equal('6');
              done();
            });
          });
        });
      });
    });

    it('should return denormalized community members (user member)', function(done) {
      this.helpers.api.applyDomainDeployment('linagora_IT', (err, models) => {
        expect(err).to.not.exist;

        this.helpers.api.loginAsUser(webserver.application, models.users[0].emails[0], 'secret', (err, loggedInAsUser) => {
          if (err) { return done(err); }

          const req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + models.communities[0]._id + '/members'));

          req.query({ limit: 1 });
          req.expect(200);
          req.end((err, res) => {
            expect(err).to.not.exist;
            expect(res.body).to.have.length(1);
            expect(res.body[0]).to.shallowDeepEqual({
              objectType: 'user',
              id: models.users[0].id,
              user: {
                _id: models.users[0].id
              }
            });
            expect(res.body[0].user.accounts).to.not.exist;
            expect(res.body[0].user.password).to.not.exist;
            done();
          });
        });
      });
    });

    it('should return denormalized community members (email member)', function(done) {
      this.helpers.api.applyDomainDeployment('linagora_IT', (err, models) => {
        expect(err).to.not.exist;

        const member = { id: 'test-member@email.com', objectType: 'email' };

        models.communities[0].members.push({ member });
        models.communities[0].save(err => {
          expect(err).to.not.exist;

          this.helpers.api.loginAsUser(webserver.application, models.users[0].emails[0], 'secret', (err, loggedInAsUser) => {
            expect(err).to.not.exist;

            const req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + models.communities[0]._id + '/members'));

            req.query({ objectTypeFilter: 'email' });
            req.expect(200);
            req.end((err, res) => {
              expect(err).to.not.exist;
              expect(res.body).to.have.length(1);
              expect(res.body[0]).to.shallowDeepEqual({
                objectType: member.objectType,
                id: member.id,
                email: member.id
              });
              done();
            });
          });
        });
      });
    });
  });

  describe('DELETE /api/collaborations/community/:id/members/:user_id', function() {

    it('should return 401 if user is not authenticated', function(done) {
      this.helpers.api.requireLogin(webserver.application, 'delete', '/api/collaborations/community/123/members/123', done);
    });

    it('should return 404 if community does not exist', function(done) {
      var ObjectId = require('bson').ObjectId;
      var id = new ObjectId();
      this.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(webserver.application).delete('/api/collaborations/community/' + id + '/members/123'));
        req.expect(404);
        req.end(function(err) {
          expect(err).to.be.null;
          done();
        });
      });
    });

    it('should return 403 if current user is the community creator and tries to remove himself', function(done) {
      var self = this;
      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { return done(err); }
        var manager = models.users[0];
        var community = models.communities[1];

        self.helpers.api.loginAsUser(webserver.application, manager.emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(request(webserver.application).delete('/api/collaborations/community/' + community._id + '/members/' + manager._id));
          req.expect(403);
          req.end(function(err) {
            expect(err).to.not.exist;
            done();
          });
        });
      });
    });

    it('should remove the current user from members if in', function(done) {
      var self = this;
      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { return done(err); }
        var manager = models.users[0];
        var community = models.communities[1];

        self.helpers.api.loginAsUser(webserver.application, models.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(request(webserver.application).delete('/api/collaborations/community/' + community._id + '/members/' + models.users[1]._id));
          req.expect(204);
          req.end(function(err) {
            expect(err).to.not.exist;
            Community.find({_id: community._id}, function(err, document) {
              if (err) {
                return done(err);
              }
              expect(document[0].members.length).to.equal(1);
              expect(document[0].members[0].member.id + '').to.equal(manager.id);
              done();
            });
          });
        });
      });
    });

    it('should remove the user from members if already in and current user creator', function(done) {
      var self = this;
      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { return done(err); }
        var user0 = models.users[0];
        var user1 = models.users[1];
        var community = models.communities[1];

        self.helpers.api.loginAsUser(webserver.application, user1.emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(request(webserver.application).delete('/api/collaborations/community/' + community._id + '/members/' + user1._id));
          req.expect(204);
          req.end(function(err) {
            expect(err).to.not.exist;
            Community.find({_id: community._id}, function(err, document) {
              if (err) {
                return done(err);
              }
              expect(document[0].members.length).to.equal(1);
              expect(document[0].members[0].member.id + '').to.equal(user0.id);
              done();
            });
          });
        });
      });
    });

    it('should remove the user from members if in and current user collaboration manager', function(done) {
      var self = this;

      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { return done(err); }
        var manager = models.users[0];
        var user1 = models.users[1];
        var community = models.communities[1];

        self.helpers.api.loginAsUser(webserver.application, manager.emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(request(webserver.application).delete('/api/collaborations/community/' + community._id + '/members/' + user1._id));

          req.expect(204);
          req.end(function(err) {
            expect(err).to.not.exist;
            Community.find({_id: community._id}, function(err, document) {
              if (err) {
                return done(err);
              }
              expect(document[0].members.length).to.equal(1);
              expect(document[0].members[0].member.id + '').to.equal(manager.id);
              done();
            });
          });
        });
      });
    });
  });

  describe('GET /api/collaborations/community/:id/members', function() {

    it('should return 401 if user is not authenticated', function(done) {
      this.helpers.api.requireLogin(webserver.application, 'get', '/api/collaborations/community/123/members', done);
    });

    describe('access rights', function() {
      beforeEach(function(done) {
        var self = this;
        var user, domain;
        this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
          if (err) { return done(err); }
          self.models = models;
          domain = models.domain;
          user = models.users[0];
          var member = {member: {id: models.users[1]._id, objectType: 'user'}};
          function patchCommunity(type) {
            return function(json) {
              json.type = type;
              json.members.push(member);
              return json;
            };
          }

          async.series([
            function(callback) {
              self.helpers.api.createCommunity('Open', user, domain, patchCommunity('open'), callback);
            },
            function(callback) {
              self.helpers.api.createCommunity('Restricted', user, domain, patchCommunity('restricted'), callback);
            },
            function(callback) {
              self.helpers.api.createCommunity('Private', user, domain, patchCommunity('private'), callback);
            },
            function(callback) {
              self.helpers.api.createCommunity('Confidential', user, domain, patchCommunity('confidential'), callback);
            }
          ], function(err, communities) {
            if (err) { return done(err); }
            self.communities = communities;
            done();
          });
        });
      });

      describe('open communities', function() {
        beforeEach(function() {
          this.com = this.communities[0];
          this.creator = this.models.users[0].emails[0];
          this.member = this.models.users[1].emails[0];
          this.nonMember = this.models.users[2].emails[0];
        });
        it('should return 200 if user is not a member', function(done) {
          var self = this;
          this.helpers.api.loginAsUser(webserver.application, this.nonMember, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + self.com._id + '/members'));
            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
        it('should return 200 if user is a member', function(done) {
          var self = this;
          this.helpers.api.loginAsUser(webserver.application, this.member, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + self.com._id + '/members'));
            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });
      describe('restricted communities', function() {
        beforeEach(function() {
          this.com = this.communities[1];
          this.creator = this.models.users[0].emails[0];
          this.member = this.models.users[1].emails[0];
          this.nonMember = this.models.users[2].emails[0];
        });
        it('should return 200 if user is not a member', function(done) {
          var self = this;
          this.helpers.api.loginAsUser(webserver.application, this.nonMember, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + self.com._id + '/members'));
            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
        it('should return 200 if user is a member', function(done) {
          var self = this;
          this.helpers.api.loginAsUser(webserver.application, this.member, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + self.com._id + '/members'));
            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });
      describe('private communities', function() {
        beforeEach(function() {
          this.com = this.communities[2];
          this.creator = this.models.users[0].emails[0];
          this.member = this.models.users[1].emails[0];
          this.nonMember = this.models.users[2].emails[0];
        });
        it('should return 403 if user is not a member', function(done) {
          var self = this;
          this.helpers.api.loginAsUser(webserver.application, this.nonMember, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + self.com._id + '/members'));
            req.expect(403);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
        it('should return 200 if user is a member', function(done) {
          var self = this;
          this.helpers.api.loginAsUser(webserver.application, this.member, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + self.com._id + '/members'));
            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });
      describe('confidential communities', function() {
        beforeEach(function() {
          this.com = this.communities[3];
          this.creator = this.models.users[0].emails[0];
          this.member = this.models.users[1].emails[0];
          this.nonMember = this.models.users[2].emails[0];
        });
        it('should return 403 if user is not a member', function(done) {
          var self = this;
          this.helpers.api.loginAsUser(webserver.application, this.nonMember, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + self.com._id + '/members'));
            req.expect(403);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
        it('should return 200 if user is a member', function(done) {
          var self = this;
          this.helpers.api.loginAsUser(webserver.application, this.member, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + self.com._id + '/members'));
            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });
    });

    it('should return 404 if community does not exist', function(done) {
      var ObjectId = require('bson').ObjectId;
      var id = new ObjectId();

      this.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + id + '/members'));
        req.expect(404);
        req.end(function(err) {
          expect(err).to.not.exist;
          done();
        });
      });
    });

    it('should return the members list', function(done) {
      var self = this;
      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { return done(err); }
        self.helpers.api.loginAsUser(webserver.application, models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) { return done(err); }
          var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + models.communities[0]._id + '/members'));
          req.expect(200);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.be.an.array;
            expect(res.body.length).to.equal(2);
            expect(res.body[0].user).to.exist;
            expect(res.body[0].user._id).to.exist;
            expect(res.body[0].user.password).to.not.exist;
            expect(res.body[0].metadata).to.exist;
            done();
          });
        });
      });
    });

    it('should return the sliced members list', function(done) {
      var self = this;
      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { return done(err); }
        models.communities[0].members.push({member: {id: self.mongoose.Types.ObjectId(), objectType: 'user'}});
        models.communities[0].members.push({member: {id: self.mongoose.Types.ObjectId(), objectType: 'user'}});
        models.communities[0].members.push({member: {id: self.mongoose.Types.ObjectId(), objectType: 'user'}});
        models.communities[0].members.push({member: {id: self.mongoose.Types.ObjectId(), objectType: 'user'}});
        models.communities[0].save(function() {
          self.helpers.api.loginAsUser(webserver.application, models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + models.communities[0]._id + '/members'));
            req.query({limit: 3, offset: 1});
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.body).to.be.an.array;
              expect(res.body.length).to.equal(3);
              done();
            });
          });
        });
      });
    });

    it('should return number of community members in the header', function(done) {
      var self = this;
      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { return done(err); }
        models.communities[0].members.push({member: {id: self.mongoose.Types.ObjectId(), objectType: 'user'}});
        models.communities[0].members.push({member: {id: self.mongoose.Types.ObjectId(), objectType: 'user'}});
        models.communities[0].members.push({member: {id: self.mongoose.Types.ObjectId(), objectType: 'user'}});
        models.communities[0].members.push({member: {id: self.mongoose.Types.ObjectId(), objectType: 'user'}});
        models.communities[0].save(function() {
          self.helpers.api.loginAsUser(webserver.application, models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + models.communities[0]._id + '/members'));
            req.query({limit: 3, offset: 1});
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.headers['x-esn-items-count']).to.equal('6');
              done();
            });
          });
        });
      });
    });
  });

  describe('GET /api/collaborations/community/:id/members/:user_id', function() {

    it('should return 401 if user is not authenticated', function(done) {
      this.helpers.api.requireLogin(webserver.application, 'get', '/api/collaborations/community/123/members/456', done);
    });

    it('should return 404 if community does not exist', function(done) {
      var ObjectId = require('bson').ObjectId;
      var id = new ObjectId();
      var user_id = new ObjectId();
      this.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + id + '/members/' + user_id));
        req.expect(404);
        req.end(function(err) {
          expect(err).to.be.null;
          done();
        });
      });
    });

    describe('access rights', function() {
      beforeEach(function(done) {
        var self = this;
        var user, domain;
        this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
          if (err) { return done(err); }
          self.models = models;
          domain = models.domain;
          user = models.users[0];
          var member = { member: {
            id: models.users[1]._id,
            objectType: 'user'
          }
          };
          function patchCommunity(type) {
            return function(json) {
              json.type = type;
              json.members.push(member);
              return json;
            };
          }

          async.series([
            function(callback) {
              self.helpers.api.createCommunity('Open', user, domain, patchCommunity('open'), callback);
            },
            function(callback) {
              self.helpers.api.createCommunity('Restricted', user, domain, patchCommunity('restricted'), callback);
            },
            function(callback) {
              self.helpers.api.createCommunity('Private', user, domain, patchCommunity('private'), callback);
            },
            function(callback) {
              self.helpers.api.createCommunity('Confidential', user, domain, patchCommunity('confidential'), callback);
            }
          ], function(err, communities) {
            if (err) { return done(err); }
            self.communities = communities;
            done();
          });
        });
      });

      describe('open communities', function() {
        beforeEach(function() {
          this.com = this.communities[0];
          this.creator = this.models.users[0];
          this.member = this.models.users[1].emails[0];
          this.nonMember = this.models.users[2].emails[0];
        });

        it('should return 200 if the user is not a community member', function(done) {
          var self = this;
          self.helpers.api.loginAsUser(webserver.application, self.nonMember, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + self.com._id + '/members/' + self.creator._id));
            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });

        it('should return 200 if the user is a community member', function(done) {
          var self = this;
          self.helpers.api.loginAsUser(webserver.application, self.member, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + self.com._id + '/members/' + self.creator._id));
            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      describe('restricted communities', function() {
        beforeEach(function() {
          this.com = this.communities[1];
          this.creator = this.models.users[0];
          this.member = this.models.users[1].emails[0];
          this.nonMember = this.models.users[2].emails[0];
        });

        it('should return 200 if the user is not a community member', function(done) {
          var self = this;
          self.helpers.api.loginAsUser(webserver.application, self.nonMember, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + self.com._id + '/members/' + self.creator._id));
            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });

        it('should return 200 if the user is a community member', function(done) {
          var self = this;
          self.helpers.api.loginAsUser(webserver.application, self.member, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + self.com._id + '/members/' + self.creator._id));
            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      describe('private communities', function() {
        beforeEach(function() {
          this.com = this.communities[2];
          this.creator = this.models.users[0];
          this.member = this.models.users[1].emails[0];
          this.nonMember = this.models.users[2].emails[0];
        });
        it('should return 403 if the user is not a community member', function(done) {
          var self = this;
          self.helpers.api.loginAsUser(webserver.application, self.nonMember, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + self.com._id + '/members/' + self.creator._id));
            req.expect(403);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });

        it('should return 200 if the user is a community member', function(done) {
          var self = this;
          self.helpers.api.loginAsUser(webserver.application, self.member, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + self.com._id + '/members/' + self.creator._id));
            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      describe('confidential communities', function() {
        beforeEach(function() {
          this.com = this.communities[3];
          this.creator = this.models.users[0];
          this.member = this.models.users[1].emails[0];
          this.nonMember = this.models.users[2].emails[0];
        });
        it('should return 403 if the user is not a community member', function(done) {
          var self = this;
          self.helpers.api.loginAsUser(webserver.application, self.nonMember, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + self.com._id + '/members/' + self.creator._id));
            req.expect(403);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });

        it('should return 200 if the user is a community member', function(done) {
          var self = this;
          self.helpers.api.loginAsUser(webserver.application, self.member, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + self.com._id + '/members/' + self.creator._id));
            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });
    });

    it('should return 200 if current user and input user is a community member', function(done) {
      var self = this;
      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { return done(err); }
        var community = models.communities[0];

        self.helpers.api.loginAsUser(webserver.application, models.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + community._id + '/members/' + models.users[0]._id));
          req.expect(200);
          req.end(function(err) {
            expect(err).to.not.exist;
            done();
          });
        });
      });
    });
  });
});
