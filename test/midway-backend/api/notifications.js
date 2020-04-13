const request = require('supertest');
const { expect } = require('chai');
const async = require('async');

describe('The notification API', function() {
  let app, helpers;
  let testuser;
  let testuser1;
  let testuser2;
  let simulatedCollaboration;
  const password = 'secret';

  let Notification;

  beforeEach(function(done) {
    const self = this;

    helpers = this.helpers;

    this.testEnv.initCore(function() {
      app = self.helpers.requireBackend('webserver/application');
      self.mongoose = require('mongoose');

      Notification = self.helpers.requireBackend('core/db/mongo/models/notification');

      helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        expect(err).to.not.exist;

        testuser = models.users[0];
        testuser1 = models.users[1];
        testuser2 = models.users[2];
        simulatedCollaboration = models.simulatedCollaborations[0];

        done();
      });
    });
  });

  afterEach(function(done) {
    this.helpers.mongo.dropDatabase(done);
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
      .send({username: testuser.emails[0], password: password, rememberme: true})
      .expect(200)
      .end(function(err, res) {
        expect(err).to.not.exist;

        const cookies = res.headers['set-cookie'].pop().split(';')[0];
        const req = request(app).post('/api/notifications');

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

  it('should return HTTP 201 with the created notification on POST /api/notifications with simulated collaboration as target', function(done) {
    request(app)
      .post('/api/login')
      .send({username: testuser.emails[0], password: password, rememberme: true})
      .expect(200)
      .end(function(err, res) {
        expect(err).to.not.exist;

        const cookies = res.headers['set-cookie'].pop().split(';')[0];
        const req = request(app).post('/api/notifications');

        req.cookies = cookies;
        req.send({
          title: 'My notification',
          level: 'info',
          action: 'create',
          object: 'form',
          link: 'http://localhost:8888',
          target: [{ objectType: 'simulatedCollaboration', id: simulatedCollaboration._id }]
        });
        req.expect(201);
        req.end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          done();
        });
      });
  });

  it('should return HTTP 201 and publish N times in the ', function(done) {
    const pubsub = this.helpers.requireBackend('core').pubsub.local;
    const topic = pubsub.topic('notification:external');
    let calls = 0;

    topic.subscribe(function() {
      calls++;
      if (calls === 2) {
        return done();
      }
    });

    request(app)
      .post('/api/login')
      .send({username: testuser.emails[0], password: password, rememberme: true})
      .expect(200)
      .end(function(err, res) {
        expect(err).to.not.exist;

        const cookies = res.headers['set-cookie'].pop().split(';')[0];
        const req = request(app).post('/api/notifications');

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
    const notification = new Notification({
      author: testuser._id,
      title: 'My notification',
      level: 'info',
      action: 'create',
      object: 'form',
      link: 'http://localhost:8888',
      target: [{objectType: 'user', id: testuser._id}]
    });

    notification.save(function(err, savedNotification) {
      expect(err).to.not.exist;

      request(app)
        .post('/api/login')
        .send({username: testuser.emails[0], password: password, rememberme: true})
        .expect(200)
        .end(function(err, res) {
          expect(err).to.not.exist;
          const cookies = res.headers['set-cookie'].pop().split(';')[0];
          const req = request(app).get('/api/notifications/' + savedNotification._id);

          req.cookies = cookies;
          req.expect(200)
            .end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.body).to.exist;
              expect(res.body._id).to.equal(savedNotification.id);
              done();
            });
        });
    });
  });

  it('should return HTTP 200 with the created notifications when sending GET to /api/notifications/created', function(done) {

    function saveNotification(target, author, cb) {
      const notification = new Notification({
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
        expect(err).to.not.exist;

        request(app)
          .post('/api/login')
          .send({username: testuser.emails[0], password: password, rememberme: true})
          .expect(200)
          .end(function(err, res) {
            expect(err).to.not.exist;
            const cookies = res.headers['set-cookie'].pop().split(';')[0];
            const req = request(app).get('/api/notifications/created');

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
    const notification = new Notification({
      author: testuser._id,
      title: 'My notification',
      level: 'info',
      action: 'create',
      object: 'form',
      link: 'http://localhost:8888',
      target: [{objectType: 'user', id: testuser._id}]
    });

    notification.save(function(err, savedNotification) {
      expect(err).to.not.exist;

      request(app)
        .post('/api/login')
        .send({username: testuser.emails[0], password: password, rememberme: true})
        .expect(200)
        .end(function(err, res) {
          expect(err).to.not.exist;
          const cookies = res.headers['set-cookie'].pop().split(';')[0];
          const req = request(app).put('/api/notifications/' + savedNotification._id);

          req.cookies = cookies;
          req.expect(205)
            .end(function(err) {
              expect(err).to.not.exist;

              Notification.findById(savedNotification._id, function(err, found) {
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
      const notification = new Notification({
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
          .send({username: testuser.emails[0], password: password, rememberme: true})
          .expect(200)
          .end(function(err, res) {
            expect(err).to.not.exist;
            const cookies = res.headers['set-cookie'].pop().split(';')[0];
            const req = request(app).get('/api/notifications?read=false');

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
    const notification = new Notification({
      author: testuser1._id,
      title: 'My notification',
      level: 'info',
      action: 'create',
      object: 'form',
      link: 'http://localhost:8888',
      target: [{objectType: 'user', id: testuser1._id}]
    });

    notification.save(function(err, savedNotification) {
      if (err) {
        return done(err);
      }

      request(app)
        .post('/api/login')
        .send({username: testuser.emails[0], password: password, rememberme: true})
        .expect(200)
        .end(function(err, res) {
          expect(err).to.not.exist;
          const cookies = res.headers['set-cookie'].pop().split(';')[0];
          const req = request(app).put('/api/notifications/' + savedNotification._id);

          req.cookies = cookies;
          req.expect(403)
            .end(function(err) {
              expect(err).to.not.exist;

              Notification.findById(savedNotification._id, function(err, found) {
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
