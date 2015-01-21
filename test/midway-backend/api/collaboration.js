'use strict';

var expect = require('chai').expect;
var request = require('supertest');
var async = require('async');

describe('The collaborations API', function() {

  var webserver;
  var password = 'secret';

  beforeEach(function(done) {
    var self = this;
    this.mongoose = require('mongoose');
    this.testEnv.initCore(function() {
      webserver = require(self.testEnv.basePath + '/backend/webserver').webserver;
      done();
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

});
