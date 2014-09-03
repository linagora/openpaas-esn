'use strict';

var request = require('supertest'),
  expect = require('chai').expect,
  async = require('async');


describe('The messages API', function() {
  var app;
  var testuser;
  var domain;
  var community;
  var password = 'secret';
  var email = 'foo@bar.com';

  beforeEach(function(done) {
    var self = this;
    this.testEnv.initCore(function() {
      app = require(self.testEnv.basePath + '/backend/webserver/application');
      self.mongoose = require('mongoose');
      var User = require(self.testEnv.basePath + '/backend/core/db/mongo/models/user');
      var Domain = require(self.testEnv.basePath + '/backend/core/db/mongo/models/domain');
      var Community = require(self.testEnv.basePath + '/backend/core/db/mongo/models/community');

      testuser = new User({
        username: 'Foo',
        password: password,
        emails: [email]
      });

      domain = new Domain({
        name: 'MyDomain',
        company_name: 'MyAwesomeCompany'
      });

      community = new Community({
        title: 'myCommunity'
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

      function saveCommunity(community, domain, user, cb) {
        community.domain_ids.push(domain._id);
        community.members.push({
          user: user._id
        });
        community.save(function(err, saved) {
          community._id = saved._id;
          return cb(err, saved);
        });
      }

      async.series([
        function(callback) {
          saveUser(testuser, callback);
        },
        function(callback) {
          saveDomain(domain, testuser, callback);
        },
        function(callback) {
          saveCommunity(community, domain, testuser, callback);
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

  it('should not be able to post a whatsup message without being authenticated', function(done) {
    request(app)
      .post('/api/messages')
      .expect(401)
      .end(done);
  });

  it('should not be able to post a whatsup message when targets are not defined', function(done) {
    var message = 'Hey Oh, let\'s go!';
    request(app)
      .post('/api/login')
      .send({username: email, password: password, rememberme: true})
      .expect(200)
      .end(function(err, res) {
        var cookies = res.headers['set-cookie'].pop().split(';')[0];
        var req = request(app).post('/api/messages');
        req.cookies = cookies;
        req.send({
          object: {
            description: message,
            objectType: 'whatsup'
          }
        });
        req.expect(400)
          .end(function(err, res) {
            expect(err).to.not.exist;
            done();
          });
      });
  });

  it('should not be able to post a whatsup message when message is not well formed', function(done) {
    var target = {
      objectType: 'activitystream',
      id: community.activity_stream.uuid
    };

    request(app)
      .post('/api/login')
      .send({username: email, password: password, rememberme: true})
      .expect(200)
      .end(function(err, res) {
        var cookies = res.headers['set-cookie'].pop().split(';')[0];
        var req = request(app).post('/api/messages');
        req.cookies = cookies;
        req.send({
          object: {
            yolo: 'hey',
            objectType: 'whatsup'
          },
          targets: [target]
        });
        req.expect(500)
          .end(function(err, res) {
            expect(err).to.not.exist;
            done();
          });
      });
  });

  it('should not be able to post a whatsup message on an invalid activitystream', function(done) {
    var message = 'Hey Oh, let\'s go!';
    var target = {
      objectType: 'activitystream',
      id: 'yolo'
    };
    request(app)
      .post('/api/login')
      .send({username: email, password: password, rememberme: true})
      .expect(200)
      .end(function(err, res) {
        var cookies = res.headers['set-cookie'].pop().split(';')[0];
        var req = request(app).post('/api/messages');
        req.cookies = cookies;
        req.send({
          object: {
            description: message,
            objectType: 'whatsup'
          },
          targets: [target]
        });
        req.expect(400)
          .end(function(err, res) {
            expect(err).to.not.exist;
            done();
          });
      });
  });

  it('should be able to post a whatsup message when there is an invalid target in the targets list', function(done) {
    var message = 'Hey Oh, let\'s go!';
    var invalidtarget = {
      objectType: 'activitystream',
      id: 'yolo'
    };
    var target = {
      objectType: 'activitystream',
      id: community.activity_stream.uuid
    };
    request(app)
      .post('/api/login')
      .send({username: email, password: password, rememberme: true})
      .expect(200)
      .end(function(err, res) {
        var cookies = res.headers['set-cookie'].pop().split(';')[0];
        var req = request(app).post('/api/messages');
        req.cookies = cookies;
        req.send({
          object: {
            description: message,
            objectType: 'whatsup'
          },
          targets: [invalidtarget, target]
        });
        req.expect(201)
          .end(function(err, res) {
            expect(err).to.not.exist;
            done();
          });
      });
  });

  it('should be able to post a whatsup message on a valid domain', function(done) {
    var message = 'Hey Oh, let\'s go!';
    var target = {
      objectType: 'activitystream',
      id: community.activity_stream.uuid
    };
    request(app)
      .post('/api/login')
      .send({username: email, password: password, rememberme: true})
      .expect(200)
      .end(function(err, res) {
        var cookies = res.headers['set-cookie'].pop().split(';')[0];
        var req = request(app).post('/api/messages');
        req.cookies = cookies;
        req.send({
          object: {
            description: message,
            objectType: 'whatsup'
          },
          targets: [target]
        });
        req.expect(201)
          .end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body._id).to.exist;
            done();
          });
      });
  });

  it('should create a timelineentry when posting a new whatsup message to a domain', function(done) {
    var message = 'Hey Oh, let\'s go!';
    var target = {
      objectType: 'activitystream',
      id: community.activity_stream.uuid
    };
    var TimelineEntry = this.mongoose.model('TimelineEntry');

    request(app)
      .post('/api/login')
      .send({username: email, password: password, rememberme: true})
      .expect(200)
      .end(function(err, res) {
        var cookies = res.headers['set-cookie'].pop().split(';')[0];
        var req = request(app).post('/api/messages');
        req.cookies = cookies;
        req.send({
          object: {
            description: message,
            objectType: 'whatsup'
          },
          targets: [target]
        });
        req.expect(201)
          .end(function(err, res) {

            expect(err).to.not.exist;
            expect(res.body).to.exist;

            process.nextTick(function() {

              TimelineEntry.find({}, function(err, results) {
                expect(results).to.exist;
                expect(results.length).to.equal(1);
                expect(results[0].verb).to.equal('post');
                expect(results[0].target).to.exist;
                expect(results[0].target.length).to.equal(1);
                expect(results[0].target[0].objectType).to.equal('activitystream');
                expect(results[0].target[0]._id).to.equal(community.activity_stream.uuid);
                expect(results[0].object).to.exist;
                expect(results[0].object.objectType).to.equal('whatsup');
                expect(results[0].object._id + '').to.equal(res.body._id);
                expect(results[0].actor).to.exist;
                expect(results[0].actor.objectType).to.equal('user');
                expect(results[0].actor._id + '').to.equal('' + testuser._id);
                done();
              });
            });
          });
      });
  });

  it('should be able to post a comment to a whatsup message', function(done) {
    var target = {
      objectType: 'activitystream',
      id: community.activity_stream.uuid
    };
    var cookies = {};
    request(app)
      .post('/api/login')
      .send({username: email, password: password, rememberme: true})
      .expect(200)
      .end(function(err, res) {
        cookies = res.headers['set-cookie'].pop().split(';')[0];
        var req = request(app).post('/api/messages');
        req.cookies = cookies;
        req.send({
          object: {
            description: 'a new whatsup message',
            objectType: 'whatsup'
          },
          targets: [target]
        });
        req.expect(201)
          .end(function(err, res) {
            var req = request(app).post('/api/messages');
            req.cookies = cookies;
            req.send({
                object: {
                  description: 'a new comment to the previous whatsup message',
                  objectType: 'whatsup'
                },
                inReplyTo: {
                  objectType: 'whatsup',
                  _id: res.body._id
                }
              })
              .expect(201)
              .end(function(err, res) {
                expect(err).to.not.exist;
                expect(res.body).to.exist;
                expect(res.body._id).to.exist;
                expect(res.body.parentId).to.exist;
                done();
              });
          });
      });
  });


  it('should be able to post a whatsup message on a valid community', function(done) {
    var message = 'Hey Oh, let\'s go!';
    var target = {
      objectType: 'activitystream',
      id: community.activity_stream.uuid
    };
    request(app)
      .post('/api/login')
      .send({username: email, password: password, rememberme: true})
      .expect(200)
      .end(function(err, res) {
        var cookies = res.headers['set-cookie'].pop().split(';')[0];
        var req = request(app).post('/api/messages');
        req.cookies = cookies;
        req.send({
          object: {
            description: message,
            objectType: 'whatsup'
          },
          targets: [target]
        });
        req.expect(201)
          .end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body._id).to.exist;
            done();
          });
      });
  });

  it('should create a timelineentry when posting a new whatsup message to a community', function(done) {
    var message = 'Hey Oh, let\'s go!';
    var target = {
      objectType: 'activitystream',
      id: community.activity_stream.uuid
    };
    var TimelineEntry = this.mongoose.model('TimelineEntry');

    request(app)
      .post('/api/login')
      .send({username: email, password: password, rememberme: true})
      .expect(200)
      .end(function(err, res) {
        var cookies = res.headers['set-cookie'].pop().split(';')[0];
        var req = request(app).post('/api/messages');
        req.cookies = cookies;
        req.send({
          object: {
            description: message,
            objectType: 'whatsup'
          },
          targets: [target]
        });
        req.expect(201)
          .end(function(err, res) {

            expect(err).to.not.exist;
            expect(res.body).to.exist;

            process.nextTick(function() {

              TimelineEntry.find({}, function(err, results) {
                expect(results).to.exist;
                expect(results.length).to.equal(1);
                expect(results[0].verb).to.equal('post');
                expect(results[0].target).to.exist;
                expect(results[0].target.length).to.equal(1);
                expect(results[0].target[0].objectType).to.equal('activitystream');
                expect(results[0].target[0]._id).to.equal(community.activity_stream.uuid);
                expect(results[0].object).to.exist;
                expect(results[0].object.objectType).to.equal('whatsup');
                expect(results[0].object._id + '').to.equal(res.body._id);
                expect(results[0].actor).to.exist;
                expect(results[0].actor.objectType).to.equal('user');
                expect(results[0].actor._id + '').to.equal('' + testuser._id);
                done();
              });
            });
          });
      });
  });

});
