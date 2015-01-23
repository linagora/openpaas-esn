'use strict';

var expect = require('chai').expect;
var request = require('supertest');
var async = require('async');

describe('The collaborations API', function() {

  var user;
  var email = 'user@open-paas.org';
  var password = 'secret';
  var Community, User, Domain, webserver;

  var saveCommunity = function(community, done) {
    var c = new Community(community);
    return c.save(function(err, saved) {
      if (err) {
        return done(err);
      }
      community._id = saved._id;
      return done();
    });
  };

  var saveDomain = function(domain, done) {
    var d = new Domain(domain);
    return d.save(function(err, saved) {
      if (err) {
        return done(err);
      }
      domain._id = saved._id;
      return done();
    });
  };

  var saveUser = function(user, done) {
    var u = new User(user);
    return u.save(function(err, saved) {
      if (err) {
        return done(err);
      }
      user._id = saved._id;
      return done();
    });
  };

  beforeEach(function(done) {
    var self = this;
    this.mongoose = require('mongoose');
    this.testEnv.initCore(function() {
      webserver = require(self.testEnv.basePath + '/backend/webserver').webserver;
      Community = require(self.testEnv.basePath + '/backend/core/db/mongo/models/community');
      User = require(self.testEnv.basePath + '/backend/core/db/mongo/models/user');
      Domain = require(self.testEnv.basePath + '/backend/core/db/mongo/models/domain');

      user = new User({password: password, emails: [email]});
      user.save(function(err, saved) {
        if (err) {
          return done(err);
        }
        user._id = saved._id;
        return done();
      });
    });
  });

  afterEach(function(done) {
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });

  describe('GET /api/collaborations/membersearch', function() {

    beforeEach(function(done) {
      var self = this;
      this.helpers.api.applyDomainDeployment('collaborationMembers', function(err, models) {
        if (err) { return done(err); }
        self.domain = models.domain;
        self.user = models.users[0];
        self.user2 = models.users[1];
        self.user3 = models.users[2];
        self.models = models;
        done();
      });
    });

    afterEach(function(done) {
      var self = this;
      self.helpers.api.cleanDomainDeployment(self.models, done);
    });

    it('should 401 when not logged in', function(done) {
      request(webserver.application).get('/api/collaborations/membersearch?objectType=user&id=123456789').expect(401).end(function(err) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should 400 when req.query.objectType is not set', function(done) {
      var self = this;
      self.helpers.api.loginAsUser(webserver.application, this.user2.emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) { return done(err); }

        var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/membersearch?id=' + self.user3._id));
        req.expect(400);
        done();
      });
    });

    it('should 400 when req.query.id is not set', function(done) {
      var self = this;
      self.helpers.api.loginAsUser(webserver.application, this.user2.emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) { return done(err); }

        var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/membersearch?objectType=community'));
        req.expect(400);
        done();
      });
    });

    it('should find all the collaborations where the given community is a member of', function(done) {

      var self = this;
      var tuples = [{
        objectType: 'community',
        id: '' + self.models.communities[0]._id
      }];

      self.helpers.api.addMembersInCommunity(self.models.communities[1], tuples, function(err) {
        if (err) {
          return done(err);
        }

        self.helpers.api.loginAsUser(webserver.application, self.user.emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) { return done(err); }

          var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/membersearch?objectType=community&id=' + self.models.communities[0]._id));
          req.expect(200);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body).to.be.an('array');
            expect(res.body.length).to.equal(1);
            expect(res.body[0]._id + '').to.equal(self.models.communities[1]._id + '');
            done();
          });
        });
      });
    });

    it('should find all the visible collaborations where the given community is a member of', function(done) {

      var self = this;
      var publicTuples = [{
        objectType: 'community',
        id: '' + self.models.communities[0]._id
      }];

      function test() {
        self.helpers.api.loginAsUser(webserver.application, self.models.users[3].emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) { return done(err); }

          var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/membersearch?objectType=community&id=' + self.models.communities[0]._id));
          req.expect(200);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body).to.be.an('array');
            expect(res.body.length).to.equal(1);
            expect(res.body[0]._id + '').to.equal(self.models.communities[2]._id + '');
            done();
          });
        });
      }

      async.parallel([
        function(callback) {
          return self.helpers.api.addMembersInCommunity(self.models.communities[1], publicTuples, callback);
        },
        function(callback) {
          return self.helpers.api.addMembersInCommunity(self.models.communities[2], publicTuples, callback);
        }
      ], function(err) {
        if (err) {
          return done(err);
        }
        return test();
      });
    });
  });

  describe('PUT /api/collaborations/:objectType/:id/members/:user_id', function() {

    it('should return 401 if user is not authenticated', function(done) {
      request(webserver.application).put('/api/collaborations/community/123/members/456').expect(401).end(function(err) {
        expect(err).to.be.null;
        done();
      });
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
        req.end(function(err, res) {
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
    });
  });

  describe('GET /api/collaborations/:objectType/:id/members', function() {

    it('should return 401 if user is not authenticated', function(done) {
      request(webserver.application).get('/api/collaborations/community/123/members').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
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
          this.com = this.communities[0][0];
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
            req.end(function(err, res) {
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
            req.end(function(err, res) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      describe('restricted communities', function() {

        beforeEach(function() {
          this.com = this.communities[1][0];
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
            req.end(function(err, res) {
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
            req.end(function(err, res) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      describe('private communities', function() {

        beforeEach(function() {
          this.com = this.communities[2][0];
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
            req.end(function(err, res) {
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
            req.end(function(err, res) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      describe('confidential communities', function() {

        beforeEach(function() {
          this.com = this.communities[3][0];
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
            req.end(function(err, res) {
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
            req.end(function(err, res) {
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
          req.end(function(err, res) {
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

    it('should return the sliced members list', function(done) {
      var self = this;
      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { return done(err); }
        models.communities[0].members.push({member: {id: self.mongoose.Types.ObjectId(), objectType: 'user'}});
        models.communities[0].members.push({member: {id: self.mongoose.Types.ObjectId(), objectType: 'user'}});
        models.communities[0].members.push({member: {id: self.mongoose.Types.ObjectId(), objectType: 'user'}});
        models.communities[0].members.push({member: {id: self.mongoose.Types.ObjectId(), objectType: 'user'}});
        models.communities[0].save(function(err, community) {
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
        models.communities[0].save(function(err, community) {
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

  describe('GET /api/collaborations/:objectType/:id/externalcompanies', function() {

    it('should return 401 if user is not authenticated', function(done) {
      request(webserver.application).get('/api/collaborations/community/123456/externalcompanies').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return 500 if objectType is invalid', function(done) {
      var self = this;

      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) {
          return done(err);
        }
        self.helpers.api.loginAsUser(webserver.application, models.users[0].emails[0], password, function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/badone/123456/externalcompanies'));
          req.expect(500);
          req.end(function(err, res) {
            expect(res.error).to.exist;
            done();
          });
        });
      });
    });

    it('should return 500 if id is invalid', function(done) {
      var self = this;

      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) {
          return done(err);
        }
        self.helpers.api.loginAsUser(webserver.application, models.users[0].emails[0], password, function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/123456/externalcompanies'));
          req.expect(500);
          req.end(function(err, res) {
            expect(res.error).to.exist;
            done();
          });
        });
      });
    });

    it('should return external companies', function(done) {
      var self = this;

      this.helpers.api.applyDomainDeployment('extrernalUsersCollaborations', function(err, models) {
        if (err) {
          return done(err);
        }
        self.com = models.communities[0];
        self.helpers.api.loginAsUser(webserver.application, models.users[0].emails[0], password, function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + self.com._id + '/externalcompanies'));
          req.expect(200);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body.length).to.equal(2);
            expect(res.body).to.deep.equal([{ objectType: 'company', id: 'test' }, { objectType: 'company', id: 'pipo' }]);
            done();
          });
        });
      });
    });

    it('should return external companies filtered according to the search parameter', function(done) {
      var self = this;

      this.helpers.api.applyDomainDeployment('extrernalUsersCollaborations', function(err, models) {
        if (err) {
          return done(err);
        }
        self.com = models.communities[0];
        self.helpers.api.loginAsUser(webserver.application, models.users[0].emails[0], password, function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + self.com._id + '/externalcompanies?search=nottobefound'));
          req.expect(200);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body.length).to.equal(0);

            var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + self.com._id + '/externalcompanies?search=pi'));
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.body).to.exist;
              expect(res.body.length).to.equal(1);
              expect(res.body).to.deep.equal([{ objectType: 'company', id: 'pipo' }]);
              done();
            });
          });
        });
      });
    });

  });

  describe('PUT /api/collaborations/community/:id/membership/:user_id', function() {

    it('should return 401 if user is not authenticated', function(done) {
      request(webserver.application).put('/api/collaborations/community/123/membership/456').expect(401).end(function(err) {
        expect(err).to.be.null;
        done();
      });
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
          domain.administrator = user._id;
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
      it('should return 400 if current user is not equal to :user_id param', function(done) {
        var self = this;
        this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
          if (err) { return done(err); }
          var community = models.communities[1];

          self.helpers.api.loginAsUser(webserver.application, models.users[2].emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).put('/api/collaborations/community/' + community._id + '/membership/' + models.users[3]._id));
            req.expect(400);
            req.end(function(err, res) {
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
            domain.administrator = user._id;
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
            req.end(function(err, res) {
              expect(err).to.not.exist;
              Community.findOne({_id: community._id}, function(err, document) {
                expect(document.membershipRequests).to.exist;
                expect(document.membershipRequests).to.be.an('array');
                expect(document.membershipRequests).to.have.length(1);
                expect(document.membershipRequests[0].user + '').to.equal(models.users[2]._id + '');
                expect(document.membershipRequests[0].workflow).to.equal('invitation');
                done();
              });
            });
          });
        });
      });
    });
  });

  describe('DELETE /api/collaborations/community/:id/members/:user_id', function() {

    it('should return 401 if user is not authenticated', function(done) {
      var community = {_id: 123};
      request(webserver.application). delete('/api/collaborations/community/' + community._id + '/members/123').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return 404 if community does not exist', function(done) {
      var ObjectId = require('bson').ObjectId;
      var id = new ObjectId();
      this.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(webserver.application). delete('/api/collaborations/community/' + id + '/members/123'));
        req.expect(404);
        req.end(function(err) {
          expect(err).to.be.null;
          done();
        });
      });
    });

    it('should return 403 if current user is the community creator', function(done) {
      var self = this;
      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { return done(err); }
        var manager = models.users[0];
        var community = models.communities[1];

        self.helpers.api.loginAsUser(webserver.application, manager.emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(request(webserver.application). delete('/api/collaborations/community/' + community._id + '/members/' + manager._id));
          req.expect(403);
          req.end(function(err) {
            expect(err).to.not.exist;
            done();
          });
        });
      });
    });

    it('should remove the current user from members if already in', function(done) {
      var self = this;
      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { return done(err); }
        var manager = models.users[0];
        var community = models.communities[1];

        self.helpers.api.loginAsUser(webserver.application, models.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(request(webserver.application). delete('/api/collaborations/community/' + community._id + '/members/' + models.users[1]._id));
          req.expect(204);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            Community.find({_id: community._id}, function(err, document) {
              if (err) {
                return done(err);
              }
              expect(document[0].members.length).to.equal(1);
              expect(document[0].members[0].member.id + '').to.equal('' + manager._id);
              done();
            });
          });
        });
      });
    });
  });

  describe('GET /api/collaboartions/:objectType/:id/membership', function() {

    it('should return 401 if user is not authenticated', function(done) {
      request(webserver.application).get('/api/collaborations/community/123/membership').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
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
        var self = this;
        var community = {
          title: 'Node.js',
          description: 'This is the community description',
          members: [],
          membershipRequests: []
        };
        var domain = {
          name: 'MyDomain',
          company_name: 'MyAwesomeCompany'
        };
        var foouser = {emails: ['foo@bar.com'], password: 'secret'};

        async.series([
          function(callback) {
            saveUser(foouser, callback);
          },
          function(callback) {
            domain.administrator = user._id;
            saveDomain(domain, callback);
          },
          function(callback) {
            community.creator = foouser._id;
            community.domain_ids = [domain._id];
            community.type = 'restricted';
            community.membershipRequests.push({user: user._id, workflow: 'request'});
            saveCommunity(community, callback);
          },
          function() {
            self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
              if (err) {
                return done(err);
              }
              var req = loggedInAsUser(request(webserver.application).get('/api/collaborations/community/' + community._id + '/membership'));
              req.expect(403);
              req.end(done);
            });
          }
        ], function(err) {
          if (err) {
            return done(err);
          }
        });
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
          var userA = {emails: ['foo.a@bar.com'], password: 'secret'};
          var userB = {emails: ['foo.b@bar.com'], password: 'secret'};
          var userC = {emails: ['foo.c@bar.com'], password: 'secret'};
          var userD = {emails: ['foo.d@bar.com'], password: 'secret'};
          var userE = {emails: ['foo.e@bar.com'], password: 'secret'};
          var userF = {emails: ['foo.f@bar.com'], password: 'secret'};
          var userG = {emails: ['foo.g@bar.com'], password: 'secret'};
          var userH = {emails: ['foo.h@bar.com'], password: 'secret'};
          var userI = {emails: ['foo.i@bar.com'], password: 'secret'};
          var userJ = {emails: ['foo.j@bar.com'], password: 'secret'};

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
        var userA = {emails: ['foo.a@bar.com'], password: 'secret'};
        var userB = {emails: ['foo.b@bar.com'], password: 'secret'};
        var userC = {emails: ['foo.c@bar.com'], password: 'secret'};
        var userD = {emails: ['foo.d@bar.com'], password: 'secret'};
        var userE = {emails: ['foo.e@bar.com'], password: 'secret'};
        var userF = {emails: ['foo.f@bar.com'], password: 'secret'};
        var userG = {emails: ['foo.g@bar.com'], password: 'secret'};
        var userH = {emails: ['foo.h@bar.com'], password: 'secret'};
        var userI = {emails: ['foo.i@bar.com'], password: 'secret'};
        var userJ = {emails: ['foo.j@bar.com'], password: 'secret'};

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
      request(webserver.application). delete('/api/collaborations/community/123/membership/456').expect(401).end(function(err) {
        expect(err).to.be.null;
        done();
      });
    });

    describe('when current user is not community manager', function() {

      it('should return 403 if current user is not the target user', function(done) {
        var self = this;
        self.helpers.api.loginAsUser(webserver.application, self.jhendrix.emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(
            request(webserver.application). delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.jdee._id)
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
        self.community.save(function(err, community) {
          if (err) { return done(err); }
          self.helpers.api.loginAsUser(webserver.application, self.jhendrix.emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(
              request(webserver.application). delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.jhendrix._id)
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
            request(webserver.application). delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.jhendrix._id)
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
              request(webserver.application). delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.jdee._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
              self.helpers.api.getCommunity(self.community._id, function(err, community)  {
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
          var pubsub = require(this.testEnv.basePath + '/backend/core').pubsub.local,
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
              request(webserver.application). delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.jdee._id)
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
              request(webserver.application). delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.kcobain._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
              self.helpers.api.getCommunity(self.community._id, function(err, community)  {
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
          var pubsub = require(this.testEnv.basePath + '/backend/core').pubsub.local,
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
              request(webserver.application). delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.kcobain._id)
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
              request(webserver.application). delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.jhendrix._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
              self.helpers.api.getCommunity(self.community._id, function(err, community)  {
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
              request(webserver.application). delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.jdee._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
              self.helpers.api.getCommunity(self.community._id, function(err, community)  {
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
          var pubsub = require(this.testEnv.basePath + '/backend/core').pubsub.local,
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
              request(webserver.application). delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.jdee._id)
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
              request(webserver.application). delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.kcobain._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
              self.helpers.api.getCommunity(self.community._id, function(err, community)  {
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
          var pubsub = require(this.testEnv.basePath + '/backend/core').pubsub.local,
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
              request(webserver.application). delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.kcobain._id)
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
          var mongoose = require('mongoose');
          var maxtries = 10, currenttry = 0;

          function checkusernotificationexists() {
            if (currenttry === maxtries) {
              return done(new Error('Unable to find user notification after 10 tries'));
            }
            currenttry++;

            var UN = mongoose.model('Usernotification');
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
          req.end(function(err, res) {
            var req = self.loggedInAsManager(
              request(webserver.application)
                . delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.jhendrix._id)
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
          var mongoose = require('mongoose');
          var maxtries = 10, currenttry = 0;

          function checkusernotificationexists(callback) {
            if (currenttry === maxtries) {
              return callback(new Error('Unable to find user notification after 10 tries'));
            }
            currenttry++;

            var UN = mongoose.model('Usernotification');
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

            var UN = mongoose.model('Usernotification');
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
          req.end(function(err, res) {
            checkusernotificationexists(function(err, notif) {
              if (err) { return done(err); }
              var req = self.loggedInAsManager(
                request(webserver.application)
                  . delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.jhendrix._id)
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

  describe('GET /api/collaborations/community/:id/members', function() {

    it('should return 401 if user is not authenticated', function(done) {
      request(webserver.application).get('/api/collaborations/community/123/members').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
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
          this.com = this.communities[0][0];
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
            req.end(function(err, res) {
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
            req.end(function(err, res) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });
      describe('restricted communities', function() {
        beforeEach(function() {
          this.com = this.communities[1][0];
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
            req.end(function(err, res) {
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
            req.end(function(err, res) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });
      describe('private communities', function() {
        beforeEach(function() {
          this.com = this.communities[2][0];
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
            req.end(function(err, res) {
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
            req.end(function(err, res) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });
      describe('confidential communities', function() {
        beforeEach(function() {
          this.com = this.communities[3][0];
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
            req.end(function(err, res) {
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
            req.end(function(err, res) {
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
        req.end(function(err, res) {
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
        models.communities[0].save(function(err, community) {
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
        models.communities[0].save(function(err, community) {
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

  describe('DELETE /api/collaborations/community/:id/members/:user_id', function() {

    it('should return 401 if user is not authenticated', function(done) {
      var community = {_id: 123};
      request(webserver.application). delete('/api/collaborations/community/' + community._id + '/members/123').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return 404 if community does not exist', function(done) {
      var ObjectId = require('bson').ObjectId;
      var id = new ObjectId();
      this.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(webserver.application). delete('/api/collaborations/community/' + id + '/members/123'));
        req.expect(404);
        req.end(function(err) {
          expect(err).to.be.null;
          done();
        });
      });
    });

    it('should return 403 if current user is the community creator', function(done) {
      var self = this;
      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { return done(err); }
        var manager = models.users[0];
        var community = models.communities[1];

        self.helpers.api.loginAsUser(webserver.application, manager.emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(request(webserver.application). delete('/api/collaborations/community/' + community._id + '/members/' + manager._id));
          req.expect(403);
          req.end(function(err) {
            expect(err).to.not.exist;
            done();
          });
        });
      });
    });

    it('should remove the current user from members if already in', function(done) {
      var self = this;
      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { return done(err); }
        var manager = models.users[0];
        var community = models.communities[1];

        self.helpers.api.loginAsUser(webserver.application, models.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(request(webserver.application). delete('/api/collaborations/community/' + community._id + '/members/' + models.users[1]._id));
          req.expect(204);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            Community.find({_id: community._id}, function(err, document) {
              if (err) {
                return done(err);
              }
              expect(document[0].members.length).to.equal(1);
              expect(document[0].members[0].member.id + '').to.equal('' + manager._id);
              done();
            });
          });
        });
      });
    });
  });

  describe('GET /api/collaborations/community/:id/members/:user_id', function() {

    it('should return 401 if user is not authenticated', function(done) {
      request(webserver.application).get('/api/collaborations/community/123/members/456').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
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
          this.com = this.communities[0][0];
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
            req.end(function(err, res) {
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
            req.end(function(err, res) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      describe('restricted communities', function() {
        beforeEach(function() {
          this.com = this.communities[1][0];
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
            req.end(function(err, res) {
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
            req.end(function(err, res) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      describe('private communities', function() {
        beforeEach(function() {
          this.com = this.communities[2][0];
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
            req.end(function(err, res) {
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
            req.end(function(err, res) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      describe('confidential communities', function() {
        beforeEach(function() {
          this.com = this.communities[3][0];
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
            req.end(function(err, res) {
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
            req.end(function(err, res) {
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
          req.end(function(err, res) {
            expect(err).to.not.exist;
            done();
          });
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
      request(webserver.application). delete('/api/collaborations/community/123/membership/456').expect(401).end(function(err) {
        expect(err).to.be.null;
        done();
      });
    });

    describe('when current user is not community manager', function() {

      it('should return 403 if current user is not the target user', function(done) {
        var self = this;
        self.helpers.api.loginAsUser(webserver.application, self.jhendrix.emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(
            request(webserver.application). delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.jdee._id)
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
        self.community.save(function(err, community) {
          if (err) { return done(err); }
          self.helpers.api.loginAsUser(webserver.application, self.jhendrix.emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(
              request(webserver.application). delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.jhendrix._id)
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
            request(webserver.application). delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.jhendrix._id)
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
              request(webserver.application). delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.jdee._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
              self.helpers.api.getCommunity(self.community._id, function(err, community)  {
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
          var pubsub = require(this.testEnv.basePath + '/backend/core').pubsub.local,
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
              request(webserver.application). delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.jdee._id)
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
              request(webserver.application). delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.kcobain._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
              self.helpers.api.getCommunity(self.community._id, function(err, community)  {
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
          var pubsub = require(this.testEnv.basePath + '/backend/core').pubsub.local,
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
              request(webserver.application). delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.kcobain._id)
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
              request(webserver.application). delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.jhendrix._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
              self.helpers.api.getCommunity(self.community._id, function(err, community)  {
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
              request(webserver.application). delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.jdee._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
              self.helpers.api.getCommunity(self.community._id, function(err, community)  {
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
          var pubsub = require(this.testEnv.basePath + '/backend/core').pubsub.local,
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
              request(webserver.application). delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.jdee._id)
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
              request(webserver.application). delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.kcobain._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
              self.helpers.api.getCommunity(self.community._id, function(err, community)  {
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
          var pubsub = require(this.testEnv.basePath + '/backend/core').pubsub.local,
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
              request(webserver.application). delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.kcobain._id)
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
        it.skip('should add a usernotification for the user', function(done) {
          var self = this;
          var mongoose = require('mongoose');
          var maxtries = 10, currenttry = 0;

          function checkusernotificationexists() {
            if (currenttry === maxtries) {
              return done(new Error('Unable to find user notification after 10 tries'));
            }
            currenttry++;

            var UN = mongoose.model('Usernotification');
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
              .put('/api/collaboration/community/' + self.community._id + '/membership/' + self.jhendrix._id)
          );
          req.end(function(err, res) {
            var req = self.loggedInAsManager(
              request(webserver.application)
                . delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.jhendrix._id)
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
          var mongoose = require('mongoose');
          var maxtries = 10, currenttry = 0;

          function checkusernotificationexists(callback) {
            if (currenttry === maxtries) {
              return callback(new Error('Unable to find user notification after 10 tries'));
            }
            currenttry++;

            var UN = mongoose.model('Usernotification');
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

            var UN = mongoose.model('Usernotification');
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
          req.end(function(err, res) {
            checkusernotificationexists(function(err, notif) {
              if (err) { return done(err); }
              var req = self.loggedInAsManager(
                request(webserver.application)
                  . delete('/api/collaborations/community/' + self.community._id + '/membership/' + self.jhendrix._id)
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
