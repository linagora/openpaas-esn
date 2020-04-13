const request = require('supertest');
const { expect } = require('chai');
const async = require('async');
const q = require('q');
const uuidV4 = require('uuid/v4');

describe.skip('The messages API', function() {
  let app, helpers, mongoose;
  let testuser;
  let restrictedUser;
  let userNotInPrivateCollaboration;
  let userExternal;
  let userExternal1;
  let userExternal2;
  let collaboration;
  let restrictedCollaboration;
  let privateCollaboration;
  let openCollaboration;
  const password = 'secret';
  let email;
  let restrictedEmail;
  let message1, message2, message3, message4, message5, message6, comment, messageOnOpenCommunity;

  beforeEach(function(done) {
    var self = this;

    helpers = this.helpers;
    this.testEnv.initCore(function() {
      app = self.helpers.requireBackend('webserver/application');
      mongoose = require('mongoose');
      const Whatsup = self.helpers.requireBackend('core/db/mongo/models/whatsup');

      function saveMessage(message, callback) {
        message.save(function(err, saved) {
          if (saved) {
            message._id = saved._id;
          }

          return callback(err, saved);
        });
      }

      self.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) {
          return done(err);
        }
        testuser = models.users[0];
        restrictedUser = models.users[1];
        userNotInPrivateCollaboration = models.users[2];
        userExternal = models.users[3];
        userExternal1 = models.users[5];
        userExternal2 = models.users[6];
        collaboration = models.simulatedCollaborations[0];
        privateCollaboration = models.simulatedCollaborations[1];
        restrictedCollaboration = models.simulatedCollaborations[2];
        openCollaboration = models.simulatedCollaborations[3];
        email = testuser.emails[0];
        restrictedEmail = restrictedUser.emails[0];

        message1 = new Whatsup({
          content: 'message 1',
          shares: [{
            objectType: 'activitystream',
            id: collaboration.activity_stream.uuid
          }]
        });

        message2 = new Whatsup({
          content: 'message 2',
          shares: [{
            objectType: 'activitystream',
            id: collaboration.activity_stream.uuid
          }]
        });

        message3 = new Whatsup({
          content: 'message 3',
          responses: 'responses'
        });

        var comment1 = new Whatsup({
          content: 'comment 1',
          author: testuser._id
        });

        message4 = new Whatsup({
          content: 'message 4',
          responses: [comment1]
        });

        message5 = new Whatsup({
          content: 'message 5',
          shares: [{
            objectType: 'activitystream',
            id: privateCollaboration.activity_stream.uuid
          }]
        });

        comment = new Whatsup({
          content: 'My comment',
          author: testuser._id
        });

        message6 = new Whatsup({
          content: 'message 6',
          responses: [comment],
          shares: [{
            objectType: 'activitystream',
            id: privateCollaboration.activity_stream.uuid
          }]
        });

        messageOnOpenCommunity = new Whatsup({
          content: 'message on open collaboration',
          shares: [{
            objectType: 'activitystream',
            id: openCollaboration.activity_stream.uuid
          }]
        });

        async.series([
            function(callback) {
              message1.author = testuser._id;
              saveMessage(message1, callback);
            },
            function(callback) {
              message2.author = restrictedUser._id;
              saveMessage(message2, callback);
            },
            function(callback) {
              message3.author = testuser._id;
              saveMessage(message3, callback);
            },
            function(callback) {
              message4.author = testuser._id;
              saveMessage(message4, callback);
            },
            function(callback) {
              message5.author = testuser._id;
              saveMessage(message5, callback);
            },
            function(callback) {
              message6.author = testuser._id;
              saveMessage(message6, callback);
            },
            function(callback) {
              messageOnOpenCommunity.author = testuser._id;
              saveMessage(messageOnOpenCommunity, callback);
            },
            function(callback) {
              restrictedCollaboration.members.splice(0, 1);
              restrictedCollaboration.markModified('members');
              restrictedCollaboration.save(function(err, saved) {
                if (err) {
                  return done(err);
                }
                restrictedCollaboration = saved;
                return callback(null, saved);
              });
            },
            function(callback) {
              collaboration.members.push({member: {objectType: 'user', id: userExternal._id}});
              collaboration.members.push({member: {objectType: 'user', id: userExternal1._id}});
              collaboration.members.push({member: {objectType: 'user', id: userExternal2._id}});
              collaboration.markModified('members');
              collaboration.save(function(err, saved) {
                if (err) {
                  return done(err);
                }
                collaboration = saved;
                return callback(null, saved);
              });
            }
          ],
          function(err) {
            done(err);
          });
      });
    });
  });

  afterEach(function(done) {
    helpers.mongo.dropDatabase(done);
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
          .end(function(err) {
            expect(err).to.not.exist;
            done();
          });
      });
  });

  it('should not be able to post a whatsup message when message is not well formed', function(done) {
    var target = {
      objectType: 'activitystream',
      id: collaboration.activity_stream.uuid
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
          .end(function(err) {
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
          .end(function(err) {
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
      id: collaboration.activity_stream.uuid
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
          .end(function(err) {
            expect(err).to.not.exist;
            done();
          });
      });
  });

  it('should be able to post a whatsup message on an open collaboration', function(done) {
    var message = 'Hey Oh, let\'s go!';
    var target = {
      objectType: 'activitystream',
      id: collaboration.activity_stream.uuid
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

  it('should create a timelineentry when posting a new whatsup message to a collaboration', function(done) {
    var message = 'Hey Oh, let\'s go!';
    var target = {
      objectType: 'activitystream',
      id: collaboration.activity_stream.uuid
    };
    var TimelineEntry = mongoose.model('TimelineEntry');

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
                expect(results[0].target[0]._id).to.equal(collaboration.activity_stream.uuid);
                expect(results[0].object).to.exist;
                expect(results[0].object.objectType).to.equal('whatsup');
                expect(results[0].object.id).to.equal(res.body._id);
                expect(results[0].actor).to.exist;
                expect(results[0].actor.objectType).to.equal('user');
                expect(results[0].actor.id).to.equal(testuser.id);
                done();
              });
            });
          });
      });
  });

  it('should be able to post a comment to a whatsup message', function(done) {
    var target = {
      objectType: 'activitystream',
      id: collaboration.activity_stream.uuid
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

  it('should be able to post a whatsup message on an open collaboration', function(done) {
    var message = 'Hey Oh, let\'s go!';
    var target = {
      objectType: 'activitystream',
      id: collaboration.activity_stream.uuid
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

  it('should create a timelineentry when posting a new whatsup message to a collaboration', function(done) {
    var message = 'Hey Oh, let\'s go!';
    var target = {
      objectType: 'activitystream',
      id: collaboration.activity_stream.uuid
    };
    var TimelineEntry = mongoose.model('TimelineEntry');

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
                expect(results[0].target[0]._id).to.equal(collaboration.activity_stream.uuid);
                expect(results[0].object).to.exist;
                expect(results[0].object.objectType).to.equal('whatsup');
                expect(results[0].object.id).to.equal(res.body._id);
                expect(results[0].actor).to.exist;
                expect(results[0].actor.objectType).to.equal('user');
                expect(results[0].actor.id).to.equal(testuser.id);
                done();
              });
            });
          });
      });
  });

  it('should not be able to post a whatsup message on a restricted collaboration', function(done) {
    var TimelineEntry = mongoose.model('TimelineEntry');

    var message = 'Hey Oh, let\'s go!';
    var target = {
      objectType: 'activitystream',
      id: restrictedCollaboration.activity_stream.uuid
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
          .end(function(err) {
            expect(err).to.not.exist;

            process.nextTick(function() {
              TimelineEntry.find({}, function(err, results) {
                expect(results).to.exist;
                expect(results.length).to.equal[0];
                done();
              });
            });
          });
      });
  });

  it('should not be able to reply to a message posted in a restricted collaboration the current user is not member of', function(done) {

    var Whatsup = mongoose.model('Whatsup');

    var self = this;
    var message = 'Post a message to a restricted collaboration';
    var target = {
      objectType: 'activitystream',
      id: restrictedCollaboration.activity_stream.uuid
    };

    helpers.api.loginAsUser(app, restrictedEmail, password, function(err, loggedInAsRestrictedUser) {
      if (err) {
        return done(err);
      }
      var response = 'This is the response message';

      var req = loggedInAsRestrictedUser(request(app).post('/api/messages'));
      req.send({
        object: {
          description: message,
          objectType: 'whatsup'
        },
        targets: [target]
      });

      req.expect(201);
      req.end(function(err, res) {
        if (err) {
          return done(err);
        }

        self.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
          var req = loggedInAsUser(request(app).post('/api/messages'));
          var messageId = res.body._id;

          req.send({
            object: {
              description: response,
              objectType: 'whatsup'
            },
            inReplyTo: {
              objectType: 'whatsup',
              _id: messageId
            }
          });

          req.expect(403);
          req.end(function(err) {
            expect(err).to.not.exist;
            process.nextTick(function() {
              Whatsup.findById(messageId, function(err, message) {
                if (err) {
                  return done(err);
                }

                expect(message).to.exist;
                expect(message.responses).to.exists;
                expect(message.responses.length).to.equal(0);
                done();
              });
            });
          });
        });
      });
    });
  });

  it('should return 404 when retrieving multiple non-existent messages', function(done) {
    var ObjectId = require('bson').ObjectId;

    helpers.api.loginAsUser(app, userNotInPrivateCollaboration.emails[0], password, function(err, loggedInAsUser) {
      if (err) { return done(err); }

      var req = loggedInAsUser(request(app).get('/api/messages?ids[]=' + new ObjectId() + '&ids[]=' + new ObjectId()));
      req.expect(404);
      req.end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.an.array;
        expect(res.body.length).to.equal(2);
        expect(res.body[0].error).to.be.an('object');
        expect(res.body[0].error.code).to.equal(404);
        expect(res.body[1].error).to.be.an('object');
        expect(res.body[1].error.code).to.equal(404);
        done();
      });
    });
  });

  it('should expand authors when retrieving multiple messages', function(done) {
    helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
      if (err) { return done(err); }

      var req = loggedInAsUser(request(app).get('/api/messages?ids[]=' + message1._id + '&ids[]=' + message2._id));
      req.expect(200);
      req.end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.an.array;
        expect(res.body.length).to.equal(2);
        expect(res.body[0].author).to.be.an('object');
        expect(res.body[0].author._id).to.equal(testuser._id.toString());
        expect(res.body[1].author).to.be.an('object');
        expect(res.body[1].author._id).to.equal(restrictedUser._id.toString());
        done();
      });
    });
  });

  it('should expand authors when retrieving a single message', function(done) {
    helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
      if (err) { return done(err); }

      var req = loggedInAsUser(request(app).get('/api/messages/' + message1._id));
      req.expect(200);
      req.end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.an('object');
        expect(res.body.author).to.be.an('object');
        expect(res.body.author._id).to.equal(testuser._id.toString());
        done();
      });
    });
  });

  it('should be able to retrieve a message which is a response from its id', function(done) {
    helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
      if (err) { return done(err); }

      var req = loggedInAsUser(request(app).get('/api/messages/' + comment._id));
      req.expect(200);
      req.end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.an('object');
        expect(res.body._id).to.equal(comment._id.toString());
        expect(res.body.content).to.equal(comment.content);
        done();
      });
    });
  });

  it('should retrieve multiple messages and responses from their ids', function(done) {
    helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
      if (err) { return done(err); }

      var req = loggedInAsUser(request(app).get('/api/messages?ids[]=' + message1._id + '&ids[]=' + comment._id));
      req.expect(200);
      req.end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.an.array;
        expect(res.body.length).to.equal(2);
        expect(res.body[0]._id).to.equal(message1._id.toString());
        expect(res.body[1]._id).to.equal(comment._id.toString());
        done();
      });
    });
  });

  it('should return 200 with a 403 object error when retrieving multiple messages with one in private collaboration', function(done) {
    helpers.api.loginAsUser(app, userNotInPrivateCollaboration.emails[0], password, function(err, loggedInAsUser) {
      if (err) { return done(err); }

      var req = loggedInAsUser(request(app).get('/api/messages?ids[]=' + message1._id + '&ids[]=' + message5._id));
      req.expect(200);
      req.end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.an.array;
        expect(res.body.length).to.equal(2);
        expect(res.body[0].author).to.be.an('object');
        expect(res.body[0].author._id).to.equal(testuser._id.toString());
        expect(res.body[1].error).to.be.an('object');
        expect(res.body[1].error.code).to.equal(403);
        done();
      });
    });
  });

  describe('POST /api/messages/:id/shares', function() {
    it('should return 400 if target is missing', function(done) {
      helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }

        var req = loggedInAsUser(request(app).post('/api/messages/' + message1._id + '/shares'));
        req.send({
          resource: {objectType: 'activitystream', id: openCollaboration.activity_stream.uuid }
        });
        req.expect(400);
        req.end(done);
      });
    });

    it('should return 400 if resource is missing', function(done) {
      helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }

        var req = loggedInAsUser(request(app).post('/api/messages/' + message1._id + '/shares'));
        req.send({
          target: [
            {objectType: 'activitystream', id: '976f55e7-b72f-4ac0-afb2-400a85c50951' }
          ]
        });
        req.expect(400);
        req.end(done);
      });
    });

    it('should return 404 if resource does not exists', function(done) {
      helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }

        var req = loggedInAsUser(request(app).post('/api/messages/' + message1._id + '/shares'));
        req.send({
          resource: {objectType: 'activitystream', id: uuidV4()},
          target: [
            {objectType: 'activitystream', id: uuidV4()}
          ]
        });
        req.expect(404);
        req.end(function(err, response) {
          if (err) {
            return done(err);
          }
          expect(response.body.error.details).to.match(/Collaboration not found/);
          done();
        });
      });
    });

    it('should return 403 if user can not read resource', function(done) {
      helpers.api.loginAsUser(app, userNotInPrivateCollaboration.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }

        var req = loggedInAsUser(request(app).post('/api/messages/' + message1._id + '/shares'));
        req.send({
          resource: {objectType: 'activitystream', id: privateCollaboration.activity_stream.uuid},
          target: [
            {objectType: 'activitystream', id: uuidV4()}
          ]
        });
        req.expect(403);
        req.end(function(err, response) {
          if (err) {
            return done(err);
          }
          expect(response.body.error.details).to.match(/Not enough rights to read messages from collaboration/);
          done();
        });
      });
    });

    it('should return 404 the message does not exists', function(done) {
      helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }

        var ObjectId = require('bson').ObjectId;
        var id = new ObjectId();
        var req = loggedInAsUser(request(app).post('/api/messages/' + id + '/shares'));
        req.send({
          resource: {objectType: 'activitystream', id: openCollaboration.activity_stream.uuid},
          target: [
            {objectType: 'activitystream', id: collaboration.activity_stream.uuid}
          ]
        });
        req.expect(404);
        req.end(function(err, response) {
          if (err) {
            return done(err);
          }
          expect(response.body.error.details).to.match(/Message has not been found/);
          done();
        });
      });
    });

    it('should return 400 resource is not a valid tuple', function(done) {
      helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }

        var req = loggedInAsUser(request(app).post('/api/messages/' + messageOnOpenCommunity._id + '/shares'));
        req.send({
          resource: {id: openCollaboration.activity_stream.uuid},
          target: [
            {objectType: 'activitystream', id: restrictedCollaboration.activity_stream.uuid}
          ]
        });
        req.expect(400);
        req.end(function(err, response) {
          if (err) {
            return done(err);
          }
          expect(response.body.error.details).to.match(/Invalid tuple/);
          done();
        });
      });
    });

    it('should return 403 when trying to share a message on a not open collaboration when user is not member of it', function(done) {
      helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }

        var req = loggedInAsUser(request(app).post('/api/messages/' + messageOnOpenCommunity._id + '/shares'));
        req.send({
          resource: {objectType: 'activitystream', id: openCollaboration.activity_stream.uuid},
          target: [
            {objectType: 'activitystream', id: restrictedCollaboration.activity_stream.uuid}
          ]
        });
        req.expect(400);
        req.end(function(err, response) {
          if (err) {
            return done(err);
          }
          expect(response.body.error.details).to.match(/Can not find any writable target in request/);
          done();
        });
      });
    });

    it('should be able to share a message on a not open collaboration the user is member of', function(done) {
      helpers.api.loginAsUser(app, restrictedEmail, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }

        var req = loggedInAsUser(request(app).post('/api/messages/' + message2._id + '/shares'));
        req.send({
          resource: {objectType: 'activitystream', id: openCollaboration.activity_stream.uuid},
          target: [
            {objectType: 'activitystream', id: restrictedCollaboration.activity_stream.uuid}
          ]
        });
        req.expect(201);
        req.end(done);
      });
    });

    it('should duplicate message3, reset responses and return the new _id', function(done) {
      var Whatsup = mongoose.model('Whatsup');
      helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }

        var req = loggedInAsUser(request(app).post('/api/messages/' + message3._id + '/shares'));
        req.send({
          resource: {objectType: 'activitystream', id: openCollaboration.activity_stream.uuid},
          target: [
            {objectType: 'activitystream', id: collaboration.activity_stream.uuid}
          ]
        });
        req.expect(201);
        req.end(function(err, res) {
          expect(err).to.be.null;
          expect(res.body._id).to.exist;
          process.nextTick(function() {
            Whatsup.findOne({_id: res.body._id}, function(err, message) {
              expect(message).to.exist;
              expect(message.responses).to.be.empty;
              done();
            });
          });
        });
      });
    });

    it('should support sharing a message comment', function(done) {
      var Whatsup = mongoose.model('Whatsup');
      var commentId = message4.responses[0]._id;
      helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }

        var req = loggedInAsUser(request(app).post('/api/messages/' + commentId + '/shares'));
        req.send({
          resource: {objectType: 'activitystream', id: openCollaboration.activity_stream.uuid},
          target: [{objectType: 'activitystream', id: collaboration.activity_stream.uuid}]
        });
        req.expect(201);
        req.end(function(err, res) {
          expect(err).to.be.null;
          expect(res.body._id).to.exist;
          process.nextTick(function() {
            Whatsup.findOne({_id: res.body._id}, function(err, message) {
              expect(message).to.exist;
              expect(message.responses).to.be.empty;
              Whatsup.findOne({_id: message4._id}, function(err, original) {
                if (err) {
                  return done(err);
                }
                expect(original).to.exist;
                expect(original.responses).to.exist;
                expect(original.responses[0]).to.exist;
                expect(original.responses[0].copyOf).to.exist;
                expect(original.responses[0].copyOf.target).to.have.length(1);
                expect(original.responses[0].copyOf.target[0].id).to.equal(collaboration.activity_stream.uuid);
                expect(original.responses[0].copyOf.target[0].objectType).to.equal('activitystream');
                done();
              });
            });
          });
        });
      });
    });

    it('should create a new timelineentry when sharing a message to a collaboration', function(done) {
      var TimelineEntry = mongoose.model('TimelineEntry');
      var target = {
        objectType: 'activitystream',
        id: collaboration.activity_stream.uuid
      };

      helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }

        var req = loggedInAsUser(request(app).post('/api/messages/' + message3._id + '/shares'));
        req.send({
          resource: {objectType: 'activitystream', id: openCollaboration.activity_stream.uuid},
          target: [target]
        });
        req.expect(201);
        req.end(function(err, res) {
          expect(err).to.be.null;
          expect(res.body._id).to.exist;
          process.nextTick(function() {
            TimelineEntry.find({}, function(err, results) {

              expect(results).to.exist;
              expect(results.length).to.equal(1);
              expect(results[0].verb).to.equal('post');
              expect(results[0].target).to.exist;
              expect(results[0].target.length).to.equal(1);
              expect(results[0].target[0].objectType).to.equal('activitystream');
              expect(results[0].target[0]._id).to.equal(collaboration.activity_stream.uuid);
              expect(results[0].object).to.exist;
              expect(results[0].object.objectType).to.equal('whatsup');
              expect(results[0].object.id).to.equal(res.body._id);
              expect(results[0].actor).to.exist;
              expect(results[0].actor.objectType).to.equal('user');
              expect(results[0].actor.id).to.equal(testuser.id);
              done();
            });
          });
        });
      });
    });
  });

  it('should save the attachments reference when posting a message', function(done) {
    var Whatsup = mongoose.model('Whatsup');
    var ObjectId = mongoose.Types.ObjectId;
    var message = 'Hey, check out these files!';
    var target = {
      objectType: 'activitystream',
      id: collaboration.activity_stream.uuid
    };
    var attachmentId = new ObjectId();
    var attachment = {_id: attachmentId, name: 'chuck.png', contentType: 'image/png', length: 988288};

    helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
      if (err) {
        return done(err);
      }

      var req = loggedInAsUser(request(app).post('/api/messages'));
      req.send({
        object: {
          description: message,
          objectType: 'whatsup',
          attachments: [attachment]
        },
        targets: [target]
      });
      req.expect(201).end(function(err, res) {
        expect(err).to.not.exist;
        expect(res.body).to.exist;
        expect(res.body._id).to.exist;

        process.nextTick(function() {
          Whatsup.findOne({_id: res.body._id}, function(err, message) {
            expect(message).to.exist;
            expect(message.attachments).to.exist;
            expect(message.attachments.length).to.equal(1);
            expect(message.attachments[0].id).to.equal(attachmentId + '');
            expect(message.attachments[0].name).to.equal(attachment.name);
            expect(message.attachments[0].contentType).to.equal(attachment.contentType);
            expect(message.attachments[0].length).to.equal(attachment.length);
            done();
          });
        });
      });
    });
  });

  it('should update the attachment references when posting a message with existing attachments', function(done) {
    var ObjectId = mongoose.Types.ObjectId;
    var Whatsup = mongoose.model('Whatsup');
    var filestore = helpers.requireBackend('core/filestore');
    var self = this;

    var message = 'Hey, check out these files!';
    var target = {
      objectType: 'activitystream',
      id: collaboration.activity_stream.uuid
    };

    var text = 'hello world';
    var name = 'hello.txt';
    var mime = 'text/plain';
    var attachmentId = new ObjectId();
    var stream = require('stream');
    var s = new stream.Readable();
    s._read = function noop() {};
    s.push(text);
    s.push(null);

    filestore.store(attachmentId, mime, {name: name, creator: {objectType: 'user', id: testuser._id}}, s, {}, function(err) {
      if (err) {
        return done(err);
      }

      var attachment = {_id: attachmentId, name: name, contentType: mime, length: 11};

      self.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }

        var req = loggedInAsUser(request(app).post('/api/messages'));
        req.send({
          object: {
            description: message,
            objectType: 'whatsup',
            attachments: [attachment]
          },
          targets: [target]
        });
        req.expect(201).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.body._id).to.exist;

          process.nextTick(function() {
            Whatsup.findOne({_id: res.body._id}, function(err, message) {
              expect(message).to.exist;
              expect(message.attachments).to.exist;
              expect(message.attachments.length).to.equal(1);
              filestore.getMeta(attachmentId, function(err, meta) {
                if (err) {
                  return done(err);
                }
                expect(meta).to.exist;
                expect(meta.metadata).to.exist;
                expect(meta.metadata.referenced).to.exist;
                expect(meta.metadata.referenced.length).to.equal(1);
                expect(meta.metadata.referenced[0].objectType).to.exist;
                expect(meta.metadata.referenced[0].objectType).to.equal('message');
                expect(meta.metadata.referenced[0].id + '').to.equal(message.id);
                done();
              });
            });
          });
        });
      });
    });
  });

  it('should be able to post a whatsup message with a parser', function(done) {
    var Whatsup = mongoose.model('Whatsup');

    var message = 'Hey Oh, let\'s go!';
    var target = {
      objectType: 'activitystream',
      id: collaboration.activity_stream.uuid
    };

    helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
      if (err) {
        return done(err);
      }
      var req = loggedInAsUser(request(app).post('/api/messages'));
      req.send({
        object: {
          description: message,
          objectType: 'whatsup',
          parsers: [{
            name: 'markdown'
          }]
        },
        targets: [target]
      });
      req.expect(201).end(function(err, res) {
        expect(err).to.not.exist;
        expect(res.body).to.exist;
        expect(res.body._id).to.exist;

        process.nextTick(function() {
          Whatsup.findOne({_id: res.body._id}, function(err, message) {
            expect(message).to.exist;
            expect(message.parsers).to.exist;
            expect(message.parsers).to.have.length(1);
            expect(message.parsers[0].name).to.equal('markdown');
            done();
          });
        });
      });
    });
  });

  describe('Check message likes', function() {
    describe('When user wants to like a message', function() {
      var ENDPOINT = '/api/resource-links';

      it('should be able to like a message when message belongs to a "likable" stream', function(done) {
        var self = this;
        var link = {
          type: 'like',
          source: {objectType: 'user', id: String(testuser._id)},
          target: {objectType: 'esn.message', id: String(message1._id)}
        };

        self.helpers.api.loginAsUser(app, email, password, self.helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
          loggedInAsUser(request(app)
            .post(ENDPOINT))
            .send(link)
            .expect(201)
            .end(self.helpers.callbacks.noErrorAnd(function(res) {
              expect(res.body).to.shallowDeepEqual(link);
              done();
            }));
        }));
      });

      it('should be able to like a response when message belongs to a "likable" stream', function(done) {
        var self = this;
        var link = {
          type: 'like',
          source: {objectType: 'user', id: String(testuser._id)},
          target: {objectType: 'esn.message', id: String(message4.responses[0]._id)}
        };

        self.helpers.api.loginAsUser(app, email, password, self.helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
          loggedInAsUser(request(app)
            .post(ENDPOINT))
            .send(link)
            .expect(201)
            .end(self.helpers.callbacks.noErrorAnd(function(res) {
              expect(res.body).to.shallowDeepEqual(link);
              done();
            }));
        }));
      });

      it('should be able to like a message with a value', function(done) {
        var self = this;
        var link = {
          type: 'like',
          source: {objectType: 'user', id: String(testuser._id)},
          target: {objectType: 'esn.message', id: String(message1._id)},
          value: '+1'
        };

        self.helpers.api.loginAsUser(app, email, password, self.helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
          loggedInAsUser(request(app)
            .post(ENDPOINT))
            .send(link)
            .expect(201)
            .end(self.helpers.callbacks.noErrorAnd(function(res) {
              expect(res.body).to.shallowDeepEqual(link);
              done();
            }));
        }));
      });

      it('should be able to like a message with an object value', function(done) {
        var self = this;
        var link = {
          type: 'like',
          source: {objectType: 'user', id: String(testuser._id)},
          target: {objectType: 'esn.message', id: String(message1._id)},
          value: {foo: 'bar'}
        };

        self.helpers.api.loginAsUser(app, email, password, self.helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
          loggedInAsUser(request(app)
            .post(ENDPOINT))
            .send(link)
            .expect(201)
            .end(self.helpers.callbacks.noErrorAnd(function(res) {
              expect(res.body).to.shallowDeepEqual(link);
              done();
            }));
        }));
      });

      it('should not be able to like the same message several times', function(done) {
        var self = this;
        var link = {
          type: 'like',
          source: {objectType: 'user', id: String(testuser._id)},
          target: {objectType: 'esn.message', id: String(message1._id)}
        };

        function like() {
          return self.helpers.requireBackend('core/like').like({objectType: 'user', id: String(testuser._id)}, {objectType: 'esn.message', id: String(message1._id)});
        }

        like().then(function() {
          self.helpers.api.loginAsUser(app, email, password, self.helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
            loggedInAsUser(request(app)
              .post(ENDPOINT))
              .send(link)
              .expect(400)
              .end(self.helpers.callbacks.noErrorAnd(function(res) {
                expect(res.body).to.shallowDeepEqual({
                  error: {
                    details: 'Message is already liked by user'
                  }
                });
                done();
              }));
          }));
        }, done);
      });

      it('should not be able to like a message which belongs to a private stream', function(done) {
        var self = this;
        var link = {
          type: 'like',
          source: {objectType: 'user', id: String(userNotInPrivateCollaboration._id)},
          target: {objectType: 'esn.message', id: String(message5._id)}
        };

        self.helpers.api.loginAsUser(app, userNotInPrivateCollaboration.emails[0], password, self.helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
          loggedInAsUser(request(app)
            .post(ENDPOINT))
            .send(link)
            .expect(400)
            .end(self.helpers.callbacks.noErrorAnd(function(res) {
              expect(res.body.error.details).to.match(/Resources are not linkable/);
              done();
            }));
        }));
      });

      it('should not be able to like a message for another user', function(done) {
        var self = this;
        var link = {
          type: 'like',
          source: {objectType: 'user', id: String(restrictedUser._id)},
          target: {objectType: 'esn.message', id: String(message1._id)}
        };

        self.helpers.api.loginAsUser(app, email, password, self.helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
          loggedInAsUser(request(app)
            .post(ENDPOINT))
            .send(link)
            .expect(400)
            .end(self.helpers.callbacks.noErrorAnd(function(res) {
              expect(res.body.error.details).to.match(/You can not like a message for someone else/);
              done();
            }));
        }));
      });

      it('should not be able to like an unknown message', function(done) {
        var self = this;
        var link = {
          type: 'like',
          source: {objectType: 'user', id: String(testuser._id)},
          target: {objectType: 'esn.message', id: String(mongoose.Types.ObjectId())}
        };

        self.helpers.api.loginAsUser(app, email, password, self.helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
          loggedInAsUser(request(app)
            .post(ENDPOINT))
            .send(link)
            .expect(400)
            .end(self.helpers.callbacks.noErrorAnd(function(res) {
              expect(res.body.error.details).to.match(/Can not find message to like/);
              done();
            }));
        }));
      });
    });

    describe('When user wants to unlike a message', function() {

      describe('DELETE /api/resource-links', function() {

        it('should be able to unlike a message when message belongs to a "likable" stream', function(done) {
          var self = this;
          var link = {
            type: 'like',
            source: {objectType: 'user', id: String(testuser._id)},
            target: {objectType: 'esn.message', id: String(message1._id)}
          };

          self.helpers.api.loginAsUser(app, email, password, self.helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
            loggedInAsUser(request(app)
              .delete('/api/resource-links'))
              .send(link)
              .expect(204)
              .end(function(err) {
                if (err) {
                  return done(err);
                }
                done();
              });
          }));
        });

        it('should not be able to unlike a message for another user', function(done) {
          var self = this;
          var link = {
            type: 'like',
            sourceId: String(testuser._id),
            sourceObjectType: 'user',
            targetId: String(message1._id),
            targetObjectType: 'esn.message'
          };
          self.helpers.api.loginAsUser(app, userNotInPrivateCollaboration.emails[0], password, self.helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
            loggedInAsUser(request(app)
              .delete('/api/resource-links'))
              .send(link)
              .expect(403)
              .end(function(err) {
                if (err) {
                  return done(err);
                }
                done();
              });
          }));
        });
      });
    });

    describe('When messages are liked', function() {

      beforeEach(function() {
        var likeModule = helpers.requireBackend('core/like');
        this.likeMessage = function(user, message) {
          return likeModule.like({objectType: 'user', id: String(user._id)}, {objectType: 'esn.message', id: String(message._id)});
        };
      });

      describe('GET /api/messages', function() {

        it('should return message.likes.me=false when current user did not liked the message', function(done) {
          var self = this;
          self.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
            if (err) { return done(err); }

            loggedInAsUser(request(app).get('/api/messages?ids[]=' + message1._id))
              .expect(200)
              .end(function(err, res) {
                if (err) {
                  return done(err);
                }
                expect(res.body[0].likes).to.exists;
                expect(res.body[0].likes.me).to.deep.equals({liked: false});
                done();
              });
          });
        });

        it('should return message.likes.me.liked=true when current user liked the message', function(done) {

          var self = this;
          function test() {
            self.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
              if (err) { return done(err); }

              loggedInAsUser(request(app).get('/api/messages?ids[]=' + message1._id))
                .expect(200)
                .end(function(err, res) {
                  if (err) {
                    return done(err);
                  }
                  expect(res.body[0].likes.me.liked).to.be.true;
                  done();
                });
            });
          }

          self.likeMessage(testuser, message1).then(test, done);
        });

        it('should return response.likes.me.liked=true when current user liked the response', function(done) {

          var self = this;
          function test() {
            self.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
              if (err) { return done(err); }

              loggedInAsUser(request(app).get('/api/messages?ids[]=' + message4._id))
                .expect(200)
                .end(function(err, res) {
                  if (err) {
                    return done(err);
                  }
                  expect(res.body[0].responses[0].likes.me.liked).to.be.true;
                  done();
                });
            });
          }

          self.likeMessage(testuser, message4.responses[0]).then(test, done);
        });

        it('should return message.total_count with the total number of likes', function(done) {
          var self = this;
          function test() {
            self.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
              if (err) { return done(err); }

              loggedInAsUser(request(app).get('/api/messages?ids[]=' + message1._id))
                .expect(200)
                .end(function(err, res) {
                  if (err) {
                    return done(err);
                  }
                  expect(res.body[0].likes.total_count).to.equal(2);
                  done();
                });
            });
          }

          q.all([
            self.likeMessage(testuser, message1),
            self.likeMessage(testuser, message2),
            self.likeMessage(restrictedUser, message1)
          ]).then(test, done);

        });

        it('should return response.total_count with the total number of likes', function(done) {
          var self = this;
          function test() {
            self.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
              if (err) { return done(err); }

              loggedInAsUser(request(app).get('/api/messages?ids[]=' + message1._id))
                .expect(200)
                .end(function(err, res) {
                  if (err) {
                    return done(err);
                  }
                  expect(res.body[0].responses[0].likes.total_count).to.equal(2);
                  done();
                });
            });
          }

          q.all([
            self.likeMessage(testuser, message4.responses[0]),
            self.likeMessage(testuser, message4.responses[0]),
            self.likeMessage(restrictedUser, message4)
          ]).then(test, done);

        });
      });
    });
  });
});
