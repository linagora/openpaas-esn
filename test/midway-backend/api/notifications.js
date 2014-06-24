'use strict';

var request = require('supertest'),
  expect = require('chai').expect,
  async = require('async');

describe.skip('The notification API', function() {

  var app;
  var testuser;
  var testuser1;
  var testuser2;
  var domain;
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
          }
        ],
        function(err) {
          done(err);
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
          target: [testuser._id]
        });
        req.expect(201)
          .end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            done();
          });
      });
  });

  it('should return HTTP 201 and create N+1 notifications is notification input target is array with N elements on POST /api/notifications', function(done) {
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
          target: [testuser1._id, testuser2._id]
        });
        req.expect(201)
          .end(function(err, res) {
            expect(err).to.not.exist;
            Notification.find(function(err, found) {
              expect(err).to.not.exist;
              expect(found).to.exist;
              expect(found.length).to.equal(3);
              done();
            });
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
      target: [testuser._id]
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

    var n = new Notification({
      title: 'My notification',
      level: 'info',
      action: 'create',
      object: 'form',
      link: 'http://localhost:8888'
    });

    function saveNotification(notification, target, author, cb) {
      if (target) {
        notification.target = [target._id];
      }

      if (author) {
        notification.author = author._id;
      }
      notification.save(cb);
    }

    async.series([
        function(callback) {
          saveNotification(n, testuser1, testuser, callback);
        },
        function(callback) {
          saveNotification(n, testuser1, testuser, callback);
        },
        function(callback) {
          saveNotification(n, testuser, testuser1, callback);
        }
      ],
      function(err) {
        done(err);
    });

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

  it('should return HTTP 205 when sending PUT to /api/notifications/:uuid', function(done) {

    var n = new Notification({
      author: testuser._id,
      title: 'My notification',
      level: 'info',
      action: 'create',
      object: 'form',
      link: 'http://localhost:8888',
      target: [testuser._id]
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

    var n = new Notification({
      title: 'My notification',
      level: 'info',
      action: 'create',
      object: 'form',
      link: 'http://localhost:8888'
    });

    function saveNotification(notification, target, author, cb) {
      if (target) {
        notification.target = [target._id];
      }

      if (author) {
        notification.author = author._id;
      }
      notification.save(cb);
    }

    async.series([
        function(callback) {
          n.read = false;
          saveNotification(n, testuser1, testuser, callback);
        },
        function(callback) {
          n.read = false;
          saveNotification(n, testuser1, testuser, callback);
        },
        function(callback) {
          n.read = true;
          saveNotification(n, testuser1, testuser, callback);
        }
      ],
      function(err) {
        done(err);
      });

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

  it('should return HTTP 403 when sending PUT to /api/notifications/:uuid and not right target', function(done) {

    var n = new Notification({
      author: testuser._id,
      title: 'My notification',
      level: 'info',
      action: 'create',
      object: 'form',
      link: 'http://localhost:8888',
      target: [testuser1._id]
    });

    n.save(function(err, _n) {

      if (err) {
        return done(err);
      }

      request(app)
        .post('/api/login')
        .send({username: email2, password: password, rememberme: true})
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
