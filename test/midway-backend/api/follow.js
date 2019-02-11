'use strict';

var request = require('supertest');
var expect = require('chai').expect;
var ObjectId = require('bson').ObjectId;
var q = require('q');

describe('The follow API', function() {

  var app;
  var user1;
  var user2;
  var password = 'secret';
  var email1;
  var fixtures;

  beforeEach(function(done) {
    var self = this;
    this.testEnv.initCore(function() {
      app = self.helpers.requireBackend('webserver/application');
      self.mongoose = require('mongoose');
      var User = self.mongoose.model('User');
      fixtures = self.helpers.requireFixture('models/users')(User);

      self.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) {
          return done(err);
        }
        user1 = models.users[0];
        user2 = models.users[1];
        email1 = user1.emails[0];
        done();
      });
    });
  });

  afterEach(function(done) {
    this.helpers.mongo.dropDatabase(done);
  });

  describe('The /users/:id/followers endpoint', function() {

    beforeEach(function() {

      this.createFollower = function(id) {
        var self = this;
        var defer = q.defer();
        var u = fixtures.newDummyUser([id + 'foo@bar.com'], 'secret');
        u.save(function(err, saved) {
          if (err) {
            return defer.reject(err);
          }
          self.helpers.requireBackend('core/user/follow').follow(saved, user1).then(function() {
            defer.resolve(saved);
          }, defer.reject);
        });
        return defer.promise;
      };

      this.createFollowers = function(size) {
        var promises = [];
        for (var i = 0; i < size; i++) {
          promises.push(this.createFollower(i));
        }
        return q.all(promises);
      };
    });

    it('should send back 401 when not authenticated', function(done) {
      this.helpers.api.requireLogin(app, 'get', '/api/users/' + user1._id + '/followers', done);
    });

    describe('HEAD request', function() {
      it('should return valid headers', function(done) {
        const self = this;
        const size = 20;

        this.createFollowers(size)
          .then(() => {
            self.helpers.api.loginAsUser(app, email1, password, self.helpers.callbacks.noErrorAnd(loggedInAsUser => {
              loggedInAsUser(request(app)
                .head(`/api/users/${user1._id}/followers`))
                .expect(200)
                .end(self.helpers.callbacks.noErrorAnd(res => {
                  expect(res.headers['x-esn-items-count']).to.equal(String(size));
                  done();
                }));
            }));
          })
          .catch(done);
      });
    });

    describe('With pagination', function() {

      it('should return a full page and the total number of followers', function(done) {
        var self = this;
        var limit = 10;
        var offset = 0;
        var size = 20;

        this.createFollowers(size).then(function() {
          self.helpers.api.loginAsUser(app, email1, password, self.helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
            loggedInAsUser(request(app)
              .get('/api/users/' + user1._id + '/followers'))
              .query({limit: limit, offset: offset})
              .expect(200)
              .end(self.helpers.callbacks.noErrorAnd(function(res) {
                expect(res.body.length).to.equal(limit);
                expect(res.headers['x-esn-items-count']).to.equal(String(size));
                done();
              }));
          }));
        }, done);
      });

      it('should return a partial page when no more followers are available', function(done) {
        var self = this;
        var limit = 20;
        var offset = 10;
        var size = 20;

        this.createFollowers(size).then(function() {
          self.helpers.api.loginAsUser(app, email1, password, self.helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
            loggedInAsUser(request(app)
              .get('/api/users/' + user1._id + '/followers'))
              .query({limit: limit, offset: offset})
              .expect(200)
              .end(self.helpers.callbacks.noErrorAnd(function(res) {
                expect(res.body.length).to.equal(size - offset);
                expect(res.headers['x-esn-items-count']).to.equal(String(size));
                done();
              }));
          }));
        }, done);
      });
    });
  });

  describe('The /users/:id/followings endpoint', function() {
    beforeEach(function() {

      this.createFollowing = function(id) {
        var self = this;
        var defer = q.defer();
        var u = fixtures.newDummyUser([id + 'foo@bar.com'], 'secret');
        u.save(function(err, saved) {
          if (err) {
            return defer.reject(err);
          }
          self.helpers.requireBackend('core/user/follow').follow(user1, saved).then(function() {
            defer.resolve(saved);
          }, defer.reject);
        });
        return defer.promise;
      };

      this.createFollowings = function(size) {
        var promises = [];
        for (var i = 0; i < size; i++) {
          promises.push(this.createFollowing(i));
        }
        return q.all(promises);
      };
    });

    it('should send back 401 when not authenticated', function(done) {
      this.helpers.api.requireLogin(app, 'get', '/api/users/' + user1._id + '/followings', done);
    });

    describe('HEAD request', function() {
      it('should return valid headers', function(done) {
        const self = this;
        const size = 20;

        this.createFollowings(size)
          .then(() => {
            self.helpers.api.loginAsUser(app, email1, password, self.helpers.callbacks.noErrorAnd(loggedInAsUser => {
              loggedInAsUser(request(app)
                .head(`/api/users/${user1._id}/followings`))
                .expect(200)
                .end(self.helpers.callbacks.noErrorAnd(res => {
                  expect(res.headers['x-esn-items-count']).to.equal(String(size));
                  done();
                }));
            }));
          })
          .catch(done);
      });
    });

    it('should return a full page and the total number of followings', function(done) {
      var self = this;
      var limit = 10;
      var offset = 0;
      var size = 20;

      this.createFollowings(size).then(function() {
        self.helpers.api.loginAsUser(app, email1, password, self.helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
          loggedInAsUser(request(app)
            .get('/api/users/' + user1._id + '/followings'))
            .query({limit: limit, offset: offset})
            .expect(200)
            .end(self.helpers.callbacks.noErrorAnd(function(res) {
              expect(res.body.length).to.equal(limit);
              expect(res.headers['x-esn-items-count']).to.equal(String(size));
              done();
            }));
        }));
      }, done);

    });

    it('should return a partial page when no more followings are available', function(done) {
      var self = this;
      var limit = 20;
      var offset = 10;
      var size = 20;

      this.createFollowings(size).then(function() {
        self.helpers.api.loginAsUser(app, email1, password, self.helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
          loggedInAsUser(request(app)
            .get('/api/users/' + user1._id + '/followings'))
            .query({limit: limit, offset: offset})
            .expect(200)
            .end(self.helpers.callbacks.noErrorAnd(function(res) {
              expect(res.body.length).to.equal(size - offset);
              expect(res.headers['x-esn-items-count']).to.equal(String(size));
              done();
            }));
        }));
      }, done);
    });
  });

  describe('The GET /users/:id/followings/:tid endpoint', function() {

    beforeEach(function() {
      this.createFollowing = function(id) {
        var self = this;
        var defer = q.defer();
        var u = fixtures.newDummyUser([id + 'foo@bar.com'], 'secret');
        u.save(function(err, saved) {
          if (err) {
            return defer.reject(err);
          }
          self.helpers.requireBackend('core/user/follow').follow(user1, saved).then(function() {
            defer.resolve(saved);
          }, defer.reject);
        });
        return defer.promise;
      };
    });

    it('should send back 401 when not authenticated', function(done) {
      this.helpers.api.requireLogin(app, 'get', '/api/users/' + user1._id + '/followings/' + user2._id, done);
    });

    it('should send back 204 when user is following other user', function(done) {
      var self = this;
      this.createFollowing('foo').then(function(createdUser) {
        self.helpers.api.loginAsUser(app, email1, password, self.helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
          loggedInAsUser(request(app)
            .get('/api/users/' + user1._id + '/followings/' + createdUser._id))
            .expect(204)
            .end(self.helpers.callbacks.noErrorAnd(function() {
              done();
            }));
        }));
      }, done);
    });

    it('should send back 404 when user is not following other user', function(done) {
      var self = this;
      self.helpers.api.loginAsUser(app, email1, password, self.helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
        loggedInAsUser(request(app)
          .get('/api/users/' + user1._id + '/followings/123456789'))
          .expect(404)
          .end(self.helpers.callbacks.noErrorAnd(function() {
            done();
          }));
      }));
    });
  });

  describe('The PUT /users/:id/followings/:tid endpoint', function() {

    it('should send back 401 when not authenticated', function(done) {
      this.helpers.api.requireLogin(app, 'put', '/api/users/' + user1._id + '/followings/' + user2._id, done);
    });

    it('should send back 400 when trying to follow yourself', function(done) {
      var self = this;
      self.helpers.api.loginAsUser(app, email1, password, self.helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
        loggedInAsUser(request(app)
          .put('/api/users/' + user1._id + '/followings/' + user1._id))
          .expect(400)
          .end(self.helpers.callbacks.noErrorAnd(function(result) {
            expect(result.body.error.details).to.match(/You can not follow yourself/);
            done();
          }));
      }));
    });

    it('should send back 400 when user does not exists', function(done) {
      var self = this;
      self.helpers.api.loginAsUser(app, email1, password, self.helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
        loggedInAsUser(request(app)
          .put('/api/users/' + user1._id + '/followings/' + new ObjectId()))
          .expect(400)
          .end(self.helpers.callbacks.noErrorAnd(function(result) {
            expect(result.body.error.details).to.match(/Can not find following/);
            done();
          }));
      }));
    });

    it('should send back 400 when user is already following other user', function(done) {
      var self = this;
      self.helpers.requireBackend('core/user/follow').follow(user1, user2).then(function() {
        self.helpers.api.loginAsUser(app, email1, password, self.helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
          loggedInAsUser(request(app)
            .put('/api/users/' + user1._id + '/followings/' + user2._id))
            .expect(400)
            .end(self.helpers.callbacks.noErrorAnd(function(result) {
              expect(result.body.error.details).to.match(/You already follow this user/);
              done();
            }));
        }));
      }, done);
    });

    it('should send back 201 on success', function(done) {
      var self = this;
      self.helpers.api.loginAsUser(app, email1, password, self.helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
        loggedInAsUser(request(app)
          .put('/api/users/' + user1._id + '/followings/' + user2._id))
          .expect(201)
          .end(self.helpers.callbacks.noErrorAnd(function() {
            done();
          }));
      }));
    });
  });

  describe('The DELETE /users/:id/followings/:tid endpoint', function() {

    it('should send back 401 when not authenticated', function(done) {
      this.helpers.api.requireLogin(app, 'delete', '/api/users/' + user1._id + '/followings/' + user2._id, done);
    });

    it('should send back 400 when trying to unfollow yourself', function(done) {
      var self = this;
      self.helpers.api.loginAsUser(app, email1, password, self.helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
        loggedInAsUser(request(app)
          .delete('/api/users/' + user1._id + '/followings/' + user1._id))
          .expect(400)
          .end(self.helpers.callbacks.noErrorAnd(function(result) {
            expect(result.body.error.details).to.match(/You can not unfollow yourself/);
            done();
          }));
      }));
    });

    it('should send back 400 when user does not exists', function(done) {
      var self = this;
      self.helpers.api.loginAsUser(app, email1, password, self.helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
        loggedInAsUser(request(app)
          .delete('/api/users/' + user1._id + '/followings/' + new ObjectId()))
          .expect(400)
          .end(self.helpers.callbacks.noErrorAnd(function(result) {
            expect(result.body.error.details).to.match(/Can not find following/);
            done();
          }));
      }));
    });

    it('should send back 400 when user is not following other user', function(done) {
      var self = this;
      self.helpers.api.loginAsUser(app, email1, password, self.helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
        loggedInAsUser(request(app)
          .delete('/api/users/' + user1._id + '/followings/' + user2._id))
          .expect(400)
          .end(self.helpers.callbacks.noErrorAnd(function(result) {
            expect(result.body.error.details).to.match(/You can not unfollow this unfollowed user/);
            done();
          }));
      }));
    });

    it('should send back 204 on success', function(done) {
      var self = this;
      self.helpers.requireBackend('core/user/follow').follow(user1, user2).then(function() {
        self.helpers.api.loginAsUser(app, email1, password, self.helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
          loggedInAsUser(request(app)
            .delete('/api/users/' + user1._id + '/followings/' + user2._id))
            .expect(204)
            .end(self.helpers.callbacks.noErrorAnd(function() {
              done();
            }));
        }));
      }, done);
    });
  });

});
