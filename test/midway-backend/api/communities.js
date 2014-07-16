'use strict';

var expect = require('chai').expect;
var request = require('supertest');
var async = require('async');

describe('The communities API', function() {

  var user;
  var email = 'user@open-paas.org';
  var password = 'secret';
  var Community, User, webserver;

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

  beforeEach(function(done) {
    var self = this;
    this.mongoose = require('mongoose');
    this.testEnv.initCore(function() {
      Community = require(self.testEnv.basePath + '/backend/core/db/mongo/models/community');
      User = require(self.testEnv.basePath + '/backend/core/db/mongo/models/user');
      webserver = require(self.testEnv.basePath + '/backend/webserver');

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

  describe('GET /api/communities', function() {
    it('should send back 401 when not logged in', function(done) {
      request(webserver.application).get('/api/communities').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return an array of communities', function(done) {
      var self = this;
      async.series([
        function(callback) {
          saveCommunity({title: 'Node.js'}, callback);
        },
        function(callback) {
          saveCommunity({title: 'Mean'}, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities'));
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.body).to.exist;
              expect(res.body).to.be.an.array;
              expect(res.body.length).to.equal(2);
              done();
            });
          });
        }],
        function(err) {
          done(err);
        }
      );
    });
  });

  describe('POST /api/communities', function() {
    it('should send back 401 when not logged in', function(done) {
      request(webserver.application).post('/api/communities').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should store the community', function(done) {
      var community = {
        title: 'Node.js',
        description: 'This is the community description'
      };
      this.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(webserver.application).post('/api/communities'));
        req.send(community);
        req.expect(201);
        req.end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.body.creator).to.exist;
          expect(res.body.creator).to.equal(user._id + '');
          expect(res.body.title).to.equal(community.title);
          expect(res.body.description).to.equal(community.description);

          Community.find(function(err, result) {
            if (err) {
              return done(err);
            }
            expect(result).to.exist;
            expect(result.length).to.equal(1);
            expect(result[0].title).to.equal(community.title);
            expect(result[0].description).to.equal(community.description);
            expect(result[0].creator + '').to.equal(user._id + '');
            done();
          });
        });
      });
    });

    it('should not store the community if one with the same name already exists', function(done) {
      var self = this;
      var community = {
        title: 'Node.js',
        description: 'This is the community description'
      };

      async.series([
        function(callback) {
          saveCommunity(community, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).post('/api/communities'));
            req.send(community);
            req.expect(500);
            req.end(function(err, res) {
              expect(err).to.not.exist;

              Community.find(function(err, result) {
                if (err) {
                  return done(err);
                }
                expect(result).to.exist;
                expect(result.length).to.equal(1);
                done();
              });
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

  describe('GET /api/communities/:id', function() {
    it('should send back 401 when not logged in', function(done) {
      var community = {_id: 123};
      request(webserver.application).get('/api/communities/' + community._id).expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should get 404 if community does not exist', function(done) {
      var ObjectId = require('bson').ObjectId;
      var id = new ObjectId();
      this.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + id));
        req.expect(404);
        req.end(function(err, res) {
          expect(err).to.be.null;
          done();
        });
      });
    });

    it('should retrieve a community from its ID', function(done) {
      var self = this;
      var community = {
        title: 'Node.js',
        description: 'This is the community description'
      };

      async.series([
        function(callback) {
          saveCommunity(community, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + community._id));
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.body._id).to.exist;
              expect(res.body.title).to.equal(community.title);
              expect(res.body.description).to.equal(community.description);
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

  describe('GET /api/communities/:id/image', function() {
    it('should send back 401 when not logged in', function(done) {
      var community = {_id: 123};
      request(webserver.application).get('/api/communities/' + community._id + '/image').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });
  });

  describe('POST /api/communities/:id/image', function() {
    it('should send back 401 when not logged in', function(done) {
      var community = {_id: 123};
      request(webserver.application).post('/api/communities/' + community._id + '/image').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });
  });

  describe('DELETE /api/communities/:id', function() {
    it('should send back 401 when not logged in', function(done) {
      var community = {_id: 123};
      request(webserver.application).delete('/api/communities/' + community._id).expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });
  });
});
