'use strict';

var expect = require('chai').expect;
var request = require('supertest');
var async = require('async');

describe('User API', function() {

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
      Community = require(self.testEnv.basePath + '/backend/core/db/mongo/models/community');
      User = require(self.testEnv.basePath + '/backend/core/db/mongo/models/user');
      Domain = require(self.testEnv.basePath + '/backend/core/db/mongo/models/domain');
      webserver = require(self.testEnv.basePath + '/backend/webserver').webserver;

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

  describe('GET /api/user/activitystreams', function() {

    it('should return 401 if user is not authenticated', function(done) {
      request(webserver.application).get('/api/user/activitystreams').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return 200 with an empty array if there are no streams', function(done) {
      this.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
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
      var uuid = '123-456-789';
      var uuid2 = '123-456-999';
      var uuid3 = '123-456-123';
      var domain = {
        name: 'MyDomain',
        company_name: 'MyAwesomeCompany',
        activity_stream: {
          uuid: uuid
        }
      };
      var community = {
        title: 'Node.js',
        description: 'This is the community description',
        status: 'open',
        activity_stream: {
          uuid: uuid2
        },
        members: []
      };
      var community2 = {
        title: 'Community2',
        description: 'This is the community description',
        status: 'open',
        activity_stream: {
          uuid: uuid3
        },
        members: []
      };
      var foouser = {emails: ['foo@bar.com'], password: 'secret'};

      async.series([
        function(callback) {
          domain.administrator = user._id;
          saveDomain(domain, callback);
        },
        function(callback) {
          foouser.domains = [{domain_id: domain._id}];
          saveUser(foouser, callback);
        },
        function(callback) {
          community.creator = foouser._id;
          community.domain_ids = [domain._id];
          community.type = 'open';
          community.members.push({user: foouser._id}, {user: user._id});
          saveCommunity(community, callback);
        },
        function(callback) {
          community2.creator = foouser._id;
          community2.type = 'open';
          community2.members.push({user: foouser._id}, {user: user._id});
          saveCommunity(community2, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, foouser.emails[0], foouser.password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).get('/api/user/activitystreams?domainid=' + domain._id));
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.body).to.be.an.array;
              expect(res.body.length).to.equal(1);
              expect(res.body[0].uuid).to.equal(uuid2);
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

    it('should return 200 with an array of community streams with only the community streams in specific domain (with multiple domain)', function(done) {

      var self = this;
      var domainUuid = '123-456-789';
      var domain2Uuid = '123-456-777';
      var communityUuid = '123-456-999';
      var community2Uuid = '123-456-123';
      var domain = {
        name: 'MyDomain',
        company_name: 'MyAwesomeCompany',
        activity_stream: {
          uuid: domainUuid
        }
      };
      var domain2 = {
        name: 'MyDomain2',
        company_name: 'MyAwesomeCompany2',
        activity_stream: {
          uuid: domain2Uuid
        }
      };
      var community = {
        title: 'Node.js',
        description: 'This is the community description',
        status: 'open',
        activity_stream: {
          uuid: communityUuid
        },
        members: []
      };
      var community2 = {
        title: 'Community2',
        description: 'This is the community description',
        status: 'open',
        activity_stream: {
          uuid: community2Uuid
        },
        members: []
      };
      var foouser = {emails: ['foo@bar.com'], password: 'secret'};

      async.series([
        function(callback) {
          domain.administrator = user._id;
          saveDomain(domain, callback);
        },
        function(callback) {
          domain2.administrator = user._id;
          saveDomain(domain2, callback);
        },
        function(callback) {
          foouser.domains = [{domain_id: domain._id}];
          saveUser(foouser, callback);
        },
        function(callback) {
          community.creator = foouser._id;
          community.domain_ids = [domain._id];
          community.type = 'open';
          community.members.push({user: foouser._id}, {user: user._id});
          saveCommunity(community, callback);
        },
        function(callback) {
          community2.creator = foouser._id;
          community2.domain_ids = [domain2._id];
          community2.type = 'open';
          community2.members.push({user: foouser._id}, {user: user._id});
          saveCommunity(community2, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, foouser.emails[0], foouser.password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).get('/api/user/activitystreams?domainid=' + domain._id));
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.body).to.be.an.array;
              expect(res.body.length).to.equal(1);
              expect(res.body[0].uuid).to.equal(communityUuid);
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

  describe('GET /api/user/communities', function() {

    it('should return 401 if user is not authenticated', function(done) {
      request(webserver.application).get('/api/user/communities').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return 200 with an empty array is there are no communities', function(done) {
      this.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
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
      var community = {
        title: 'Node.js',
        description: 'This is the community description',
        status: 'open',
        members: []
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
          community.type = 'open';
          community.members.push({user: foouser._id}, {user: user._id});
          saveCommunity(community, callback);
        },
        function(callback) {
          saveCommunity({creator: foouser._id, title: 'A', type: 'open', domain_ids: [domain._id], members: [{user: foouser._id}]}, callback);
        },
        function(callback) {
          saveCommunity({creator: foouser._id, title: 'B', type: 'open', domain_ids: [domain._id], members: [{user: foouser._id}]}, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).get('/api/user/communities'));
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.body).to.be.an.array;
              expect(res.body.length).to.equal(1);
              expect(res.body[0]._id + '').to.equal('' + community._id);
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
});
