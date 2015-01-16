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

});
