'use strict';

var expect = require('chai').expect;
var request = require('supertest');
var async = require('async');

describe('User API', function() {

  var webserver;


  beforeEach(function(done) {
    var self = this;
    this.mongoose = require('mongoose');
    this.testEnv.initCore(function() {
      webserver = require(self.testEnv.basePath + '/backend/webserver').webserver;
      self.helpers.api.applyDomainDeployment('linagora_test_domain', function(err, models) {
        if (err) { return done(err); }
        self.models1 = models;
        self.helpers.api.applyDomainDeployment('linagora_test_domain2', function(err, models) {
          if (err) { return done(err); }
          self.models2 = models;
          var jobs = models.users.map(function(user) {
            return function(done) {
              user.domains.push({domain_id: self.models1.domain._id});
              user.save(done);
            };
          });
          async.parallel(jobs, done);

        });
      });
    });
  });

  afterEach(function(done) {
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });

  describe('GET /api/user/activitystreams', function() {

    it('should return 401 if user is not authenticated', function(done) {
      request(webserver.application).get('/api/user/activitystreams').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return 200 with an empty array if there are no streams', function(done) {
      this.helpers.api.loginAsUser(webserver.application, this.models1.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(webserver.application).get('/api/user/activitystreams'));
        req.expect(200);
        req.end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.body).to.be.an.array;
          expect(res.body.length).to.equal(0);
          return done();
        });
      });
    });

    it('should return 200 with an array of community streams with only the community streams in specific domain', function(done) {
      var self = this;

      self.helpers.api.createCommunity('Open domain1', self.models2.users[1]._id, self.models1.domain._id, {}, function(err, community) {
        if (err) {
          return done(err);
        }
        self.as1 = community.activity_stream.uuid;
        self.helpers.api.createCommunity('Open domain2', self.models2.users[1]._id, self.models2.domain._id, {}, function(err, community) {
          if (err) {
            return done(err);
          }
          self.as2 = community.activity_stream.uuid;
          self.helpers.api.loginAsUser(webserver.application, self.models2.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).get('/api/user/activitystreams?domainid=' + self.models2.domain._id));
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.body).to.be.an.array;
              expect(res.body.length).to.equal(1);
              expect(res.body[0].uuid).to.equal(self.as2);
              done();
            });
          });
        });
      });

      it('should return 200 with an array of community streams in all domains', function(done) {
        var self = this;

        self.helpers.api.createCommunity('Open domain1', self.models2.users[1]._id, self.models1.domain._id, {}, function(err, community) {
          if (err) {
            return done(err);
          }
          self.as1 = community.activity_stream.uuid;
          self.helpers.api.createCommunity('Open domain2', self.models2.users[1]._id, self.models2.domain._id, {}, function(err, community) {
            if (err) {
              return done(err);
            }
            self.as2 = community.activity_stream.uuid;
            self.helpers.api.loginAsUser(webserver.application, self.models2.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
              if (err) {
                return done(err);
              }
              var req = loggedInAsUser(request(webserver.application).get('/api/user/activitystreams?domainid=' + self.models2.domain._id));
              req.expect(200);
              req.end(function(err, res) {
                expect(err).to.not.exist;
                expect(res.body).to.be.an.array;
                expect(res.body.length).to.equal(2);
                expect(res.body[0].uuid).to.equal(self.as1);
                expect(res.body[1].uuid).to.equal(self.as2);
                done();
              });
            });
          });
        });
      });
    });

  });

  describe('GET /api/user/communities', function() {

    it('should return 401 if user is not authenticated', function(done) {
      request(webserver.application).get('/api/user/communities').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return 200 with an empty array is there are no communities', function(done) {
      this.helpers.api.loginAsUser(webserver.application, this.models1.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(webserver.application).get('/api/user/communities'));
        req.expect(200);
        req.end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.body).to.be.an.array;
          expect(res.body.length).to.equal(0);
          return done();
        });
      });
    });

    it('should return the list of communities the user is member of', function(done) {
      var self = this;

      function createCommunity(name, creator, domain, member) {
        return function(done) {
          var opts = function(json) { return json; };
          if (member) {
            opts = function(json) {
              json.members.push({member: {id: member, objectType: 'user'}});
              return json;
            };
          }
          self.helpers.api.createCommunity(name, creator, domain, opts, done);
        };
      }

      async.parallel([
        createCommunity('open domain1 no member', self.models1.users[0]._id, self.models1.domain._id),
        createCommunity('open domain1 member', self.models1.users[0]._id, self.models1.domain._id, self.models2.users[1]._id),
        createCommunity('open domain2 no member', self.models2.users[0]._id, self.models1.domain._id),
        createCommunity('open domain2 member', self.models2.users[0]._id, self.models1.domain._id, self.models2.users[1]._id)
      ], function(err, communities) {
        if (err) {
          return done(err);
        }

        var correctIds = [communities[1][0]._id + '', communities[3][0]._id + ''];

        self.helpers.api.loginAsUser(webserver.application, self.models2.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(request(webserver.application).get('/api/user/communities'));
          req.expect(200);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.be.an.array;
            expect(res.body.length).to.equal(2);
            expect(correctIds).to.contain(res.body[0]._id + '');
            expect(correctIds).to.contain(res.body[1]._id + '');
            done();
          });
        });
      });

    });
  });
});
