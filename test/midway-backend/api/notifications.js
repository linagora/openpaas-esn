'use strict';

var request = require('supertest'),
  expect = require('chai').expect,
  async = require('async');

describe('The notification API', function() {

  var app;
  var testuser;
  var testuser1;
  var testuser2;
  var domain;
  var community;
  var password = 'secret';
  var email = 'foo@bar.com';
  var email1 = 'test1@bar.com';
  var email2 = 'test2@bar.com';

  var Notification;

  beforeEach(function(done) {
    var self = this;
    this.testEnv.initCore(function() {
      app = require(self.testEnv.basePath + '/backend/webserver/application');
      self.mongoose = require('mongoose');
      var User = require(self.testEnv.basePath + '/backend/core/db/mongo/models/user');
      var Domain = require(self.testEnv.basePath + '/backend/core/db/mongo/models/domain');
      Notification = require(self.testEnv.basePath + '/backend/core/db/mongo/models/notification');

      testuser = new User({
        username: 'Foo',
        password: password,
        emails: [email]
      });

      testuser1 = new User({
        username: 'TestUser1',
        password: password,
        emails: [email1]
      });

      testuser2 = new User({
        username: 'TestUser1',
        password: password,
        emails: [email2]
      });

      domain = new Domain({
        name: 'MyDomain',
        company_name: 'MyAwesomeCompany'
      });

      function saveUser(user, cb) {
        user.save(function(err, saved) {
          if (saved) {
            user._id = saved._id;
          }
          return cb(err, saved);
        });
      }

      function saveDomain(domain, user, cb) {
        domain.administrator = user;
        domain.save(function(err, saved) {
          domain._id = saved._id;
          return cb(err, saved);
        });
      }

      async.series([
          function(callback) {
            saveUser(testuser, callback);
          },
          function(callback) {
            saveUser(testuser1, callback);
          },
          function(callback) {
            saveUser(testuser2, callback);
          },
          function(callback) {
            saveDomain(domain, testuser, callback);
          },
          function(callback) {
            self.helpers.api.createCommunity('community1', testuser, domain, function(err, saved) {
              if (err) {
                return callback(err);
              }
              community = saved;
              callback(null, community);
            });
          }
        ],
        function(err) {
          return done(err);
        });
    });
  });

  afterEach(function(done) {
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });

  it('should not be able to post a notification message without being authenticated', function(done) {
    request(app)
      .post('/api/notifications')
      .expect(401)
      .end(done);
  });

  it('should return HTTP 201 with the created notification on POST /api/notifications', function(done) {
    request(app)
      .post('/api/login')
      .send({username: email, password: password, rememberme: true})
      .expect(200)
      .end(function(err, res) {
        var cookies = res.headers['set-cookie'].pop().split(';')[0];
        var req = request(app).post('/api/notifications');
        req.cookies = cookies;
        req.send({
          title: 'My notification',
          level: 'info',
          action: 'create',
          object: 'form',
          link: 'http://localhost:8888',
          target: [{objectType: 'user', id: testuser._id}]
        });
        req.expect(201)
          .end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            done();
          });
      });
  });

  it('should return HTTP 201 with the created notification on POST /api/notifications with community as target', function(done) {
    request(app)
      .post('/api/login')
      .send({username: email, password: password, rememberme: true})
      .expect(200)
      .end(function(err, res) {
        var cookies = res.headers['set-cookie'].pop().split(';')[0];
        var req = request(app).post('/api/notifications');
        req.cookies = cookies;
        req.send({
          title: 'My notification',
          level: 'info',
          action: 'create',
          object: 'form',
          link: 'http://localhost:8888',
          target: [{objectType: 'community', id: community._id}]
        });
        req.expect(201)
          .end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            done();
          });
      });
  });

  it('should return HTTP 201 and publish N times in the ', function(done) {
    var pubsub = require(this.testEnv.basePath + '/backend/core').pubsub.local;
    var topic = pubsub.topic('notification:external');
    var calls = 0;
    topic.subscribe(function() {
      calls++;
      if (calls === 2) {
        return done();
      }
    });

    request(app)
      .post('/api/login')
      .send({username: email, password: password, rememberme: true})
      .expect(200)
      .end(function(err, res) {
        var cookies = res.headers['set-cookie'].pop().split(';')[0];
        var req = request(app).post('/api/notifications');
        req.cookies = cookies;
        req.send({
          title: 'My notification',
          level: 'info',
          action: 'create',
          object: 'form',
          link: 'http://localhost:8888',
          target: [{objectType: 'user', id: testuser1._id}, {objectType: 'user', id: testuser2._id}]
        });
        req.expect(201)
          .end(function(err) {
            expect(err).to.not.exist;
          });
      });
  });

  it('should return HTTP 200 with the notification when sending GET to /api/notifications/:uuid', function(done) {

    var n = new Notification({
      author: testuser._id,
      title: 'My notification',
      level: 'info',
      action: 'create',
      object: 'form',
      link: 'http://localhost:8888',
      target: [{objectType: 'user', id: testuser._id}]
    });

    n.save(function(err, _n) {

      if (err) {
        return done(err);
      }

      request(app)
        .post('/api/login')
        .send({username: email, password: password, rememberme: true})
        .expect(200)
        .end(function(err, res) {
          var cookies = res.headers['set-cookie'].pop().split(';')[0];
          var req = request(app).get('/api/notifications/' + _n._id);
          req.cookies = cookies;
          req.expect(200)
            .end(function(err, res) {
              expect(err).to.not.exist;
                expect(res.body).to.exist;
                expect(res.body._id).to.equal('' + _n._id);
                done();
              });
            });
    });
  });

  it('should return HTTP 200 with the created notifications when sending GET to /api/notifications/created', function(done) {

    function saveNotification(target, author, cb) {
      var notification = new Notification({
        title: 'My notification',
        level: 'info',
        action: 'create',
        object: 'form',
        link: 'http://localhost:8888'
      });

      if (target) {
        notification.target = [{objectType: 'user', id: target._id}];
      }

      if (author) {
        notification.author = author._id;
      }
      notification.save(cb);
    }

    async.series([
        function(callback) {
          saveNotification(testuser1, testuser, callback);
        },
        function(callback) {
          saveNotification(testuser1, testuser, callback);
        },
        function(callback) {
          saveNotification(testuser, testuser1, callback);
        }
      ],
      function(err) {
        if (err) {
          return done(err);
        }

        request(app)
          .post('/api/login')
          .send({username: email, password: password, rememberme: true})
          .expect(200)
          .end(function(err, res) {
            var cookies = res.headers['set-cookie'].pop().split(';')[0];
            var req = request(app).get('/api/notifications/created');
            req.cookies = cookies;
            req.expect(200)
              .end(function(err, res) {
                expect(err).to.not.exist;
                expect(res.body).to.exist;
                expect(res.body).to.be.an.array;
                expect(res.body.length).to.equal(2);
                done();
              });
          });
      });
  });

  it('should return HTTP 205 when sending PUT to /api/notifications/:uuid', function(done) {

    var n = new Notification({
      author: testuser._id,
      title: 'My notification',
      level: 'info',
      action: 'create',
      object: 'form',
      link: 'http://localhost:8888',
      target: [{objectType: 'user', id: testuser._id}]
    });

    n.save(function(err, _n) {

      if (err) {
        return done(err);
      }

      request(app)
        .post('/api/login')
        .send({username: email, password: password, rememberme: true})
        .expect(200)
        .end(function(err, res) {
          var cookies = res.headers['set-cookie'].pop().split(';')[0];
          var req = request(app).put('/api/notifications/' + _n._id);
          req.cookies = cookies;
          req.expect(205)
            .end(function(err, res) {
              expect(err).to.not.exist;

              Notification.findById(_n._id, function(err, found) {
                if (err) {
                  return done(err);
                }

                if (!found) {
                  return done(new Error('Can not retrieve notification'));
                }

                expect(found.read).to.be.true;
                done();
              });
            });
        });
    });
  });

  it('should return HTTP 200 with the unread notifications when sending GET to /api/notifications?read=false', function(done) {

    function saveNotification(target, author, read, cb) {
      var notification = new Notification({
        title: 'My notification',
        level: 'info',
        action: 'create',
        object: 'form',
        link: 'http://localhost:8888',
        read: read
      });

      if (target) {
        notification.target = [{objectType: 'user', id: target._id}];
      }

      if (author) {
        notification.author = author._id;
      }
      notification.save(cb);
    }

    async.series([
        function(callback) {
          saveNotification(testuser, testuser1, false, callback);
        },
        function(callback) {
          saveNotification(testuser, testuser1, false, callback);
        },
        function(callback) {
          saveNotification(testuser, testuser1, true, callback);
        }
      ],
      function(err) {
        if (err) {
          return done(err);
        }

        request(app)
          .post('/api/login')
          .send({username: email, password: password, rememberme: true})
          .expect(200)
          .end(function(err, res) {
            var cookies = res.headers['set-cookie'].pop().split(';')[0];
            var req = request(app).get('/api/notifications?read=false');
            req.cookies = cookies;
            req.expect(200)
              .end(function(err, res) {
                expect(err).to.not.exist;
                expect(res.body).to.exist;
                expect(res.body).to.be.an.array;
                expect(res.body.length).to.equal(2);
                done();
              });
          });
      });
  });

  it('should return HTTP 403 when sending PUT to /api/notifications/:uuid and not right target', function(done) {

    var n = new Notification({
      author: testuser1._id,
      title: 'My notification',
      level: 'info',
      action: 'create',
      object: 'form',
      link: 'http://localhost:8888',
      target: [{objectType: 'user', id: testuser1._id}]
    });

    n.save(function(err, _n) {

      if (err) {
        return done(err);
      }

      request(app)
        .post('/api/login')
        .send({username: email, password: password, rememberme: true})
        .expect(200)
        .end(function(err, res) {
          var cookies = res.headers['set-cookie'].pop().split(';')[0];
          var req = request(app).put('/api/notifications/' + _n._id);
          req.cookies = cookies;
          req.expect(403)
            .end(function(err, res) {
              expect(err).to.not.exist;

              Notification.findById(_n._id, function(err, found) {
                if (err) {
                  return done(err);
                }

                if (!found) {
                  return done(new Error('Can not retrieve notification'));
                }

                expect(found.read).to.be.false;
                done();
              });
            });
        });
    });
  });
});
