'use strict';

var request = require('supertest'),
  expect = require('chai').expect,
  async = require('async');


describe('The messages API', function() {
  var app;
  var testuser;
  var restrictedUser;
  var domain;
  var community;
  var restrictedCommunity;
  var password = 'secret';
  var email = 'foo@bar.com';
  var restrictedEmail = 'restricted@bar.com';
  var message1, message2, message3;

  beforeEach(function(done) {
    var self = this;
    this.testEnv.initCore(function() {
      app = require(self.testEnv.basePath + '/backend/webserver/application');
      self.mongoose = require('mongoose');
      var Whatsup = require(self.testEnv.basePath + '/backend/core/db/mongo/models/whatsup');
      var User = require(self.testEnv.basePath + '/backend/core/db/mongo/models/user');
      var Domain = require(self.testEnv.basePath + '/backend/core/db/mongo/models/domain');
      var Community = require(self.testEnv.basePath + '/backend/core/db/mongo/models/community');

      testuser = new User({
        username: 'Foo',
        password: password,
        emails: [email]
      });

      restrictedUser = new User({
        username: 'Restricted',
        password: password,
        emails: [restrictedEmail]
      });

      domain = new Domain({
        name: 'MyDomain',
        company_name: 'MyAwesomeCompany'
      });

      community = new Community({
        title: 'myCommunity',
        type: 'open'
      });

      restrictedCommunity = new Community({
        title: 'myRestrictedCommunity',
        type: 'restricted'
      });

      message1 = new Whatsup({
        content: 'message 1'
      });

      message2 = new Whatsup({
        content: 'message 2'
      });

      message3 = new Whatsup({
        content: 'message 3',
        responses: 'responses'
      });

      function saveUser(user, cb) {
        user.save(function(err, saved) {
          if (saved) {
            user._id = saved._id;
          }
          return cb(err, saved);
        });
      }

      function saveMessage(message, cb) {
        message.save(function(err, saved) {
          if (saved) {
            message._id = saved._id;
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

      function saveCommunity(community, domain, cb) {
        community.domain_ids.push(domain._id);
        community.save(function(err, saved) {
          if (err) {
            console.log(err, err.stack);
          }
          community._id = saved._id;
          return cb(err, saved);
        });
      }

      async.series([
        function(callback) {
          saveUser(testuser, callback);
        },
        function(callback) {
          saveUser(restrictedUser, callback);
        },
        function(callback) {
          saveDomain(domain, testuser, callback);
        },
        function(callback) {
          saveCommunity(community, domain, callback);
        },
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
          restrictedCommunity.members.push(
            {
              member: {id: restrictedUser._id, objectType: 'user'},
              status: 'joined'
            }
          );
          saveCommunity(restrictedCommunity, domain, callback);
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
        req.expect(403)
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

  it('should be able to post a whatsup message on an open community', function(done) {
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


  it('should be able to post a whatsup message on an open community', function(done) {
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

  it('should not be able to post a whatsup message on a restricted community', function(done) {
    var TimelineEntry = this.mongoose.model('TimelineEntry');

    var message = 'Hey Oh, let\'s go!';
    var target = {
      objectType: 'activitystream',
      id: restrictedCommunity.activity_stream.uuid
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
        req.expect(403)
          .end(function(err, res) {
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

  it('should not be able to reply to a message posted in a restricted community the current user is not member of', function(done) {

    var Whatsup = this.mongoose.model('Whatsup');

    var self = this;
    var message = 'Post a message to a restricted community';
    var target = {
      objectType: 'activitystream',
      id: restrictedCommunity.activity_stream.uuid
    };

    this.helpers.api.loginAsUser(app, restrictedEmail, password, function(err, loggedInAsRestrictedUser) {
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

  it('should expand authors when retrieving multiple messages', function(done) {
    this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
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
    this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
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

  describe('POST /api/messages/:id/shares', function() {
    it('should return 400 if target is missing', function(done) {
      this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }

        var req = loggedInAsUser(request(app).post('/api/messages/' + message1._id + '/shares'));
        req.send({
          'resource': { 'objecType': 'activitystream', 'id': '7fd3e254-394f-46eb-994d-a2ec23e7cf27' }
        });
        req.expect(400);
        req.end(done);
      });
    });

    it('should return 400 if resource is missing', function(done) {
      this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }

        var req = loggedInAsUser(request(app).post('/api/messages/' + message1._id + '/shares'));
        req.send({
          'target': [
            {'objectType': 'activitystream', 'id': '976f55e7-b72f-4ac0-afb2-400a85c50951' }
          ]
        });
        req.expect(400);
        req.end(done);
      });
    });

    it('should return 404 the message does not exists', function(done) {
      this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }

        var req = loggedInAsUser(request(app).post('/api/messages' + message2._id + '/shares'));
        req.send({
          'resource': { 'objecType': 'activitystream', 'id': '7fd3e254-394f-46eb-994d-a2ec23e7cf27' },
          'target': [
            {'objectType': 'activitystream', 'id': '976f55e7-b72f-4ac0-afb2-400a85c50951' }
          ]
        });
        req.expect(404);
        req.end(done);
      });
    });

    it('should duplicate message3, reset responses and return the new _id', function(done) {
      var Whatsup = this.mongoose.model('Whatsup');
      this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }

        var req = loggedInAsUser(request(app).post('/api/messages/' + message3._id + '/shares'));
        req.send({
          'resource': { 'objecType': 'activitystream', 'id': '7fd3e254-394f-46eb-994d-a2ec23e7cf27' },
          'target': [
            {'objectType': 'activitystream', 'id': '976f55e7-b72f-4ac0-afb2-400a85c50951' }
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
  });

  it('should save the attachments reference when posting a message', function(done) {
    var Whatsup = this.mongoose.model('Whatsup');
    var message = 'Hey, check out these files!';
    var target = {
      objectType: 'activitystream',
      id: community.activity_stream.uuid
    };
    var attachment = {_id: '9829892-9982982-87222-238388', name: 'chuck.png', contentType: 'image/png', length: 988288};

    this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
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
            expect(message.attachments[0]._id).to.equal(attachment._id);
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
    var Whatsup = this.mongoose.model('Whatsup');
    var filestore = require(this.testEnv.basePath + '/backend/core/filestore');
    var self = this;

    var message = 'Hey, check out these files!';
    var target = {
      objectType: 'activitystream',
      id: community.activity_stream.uuid
    };

    var text = 'hello world';
    var name = 'hello.txt';
    var mime = 'text/plain';

    var stream = require('stream');
    var s = new stream.Readable();
    s._read = function noop() {};
    s.push(text);
    s.push(null);

    filestore.store('123456789', mime, {name: name, creator: {objectType: 'user', id: testuser._id}}, s, {}, function(err, saved) {
      if (err) {
        return done(err);
      }

      var attachment = {_id: '123456789', name: name, contentType: mime, length: 11};

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
              filestore.getMeta(saved.filename, function(err, meta) {
                if (err) {
                  return done(err);
                }
                expect(meta).to.exist;
                expect(meta.metadata).to.exist;
                expect(meta.metadata.referenced).to.exist;
                expect(meta.metadata.referenced.length).to.equal(1);
                expect(meta.metadata.referenced[0].objectType).to.exist;
                expect(meta.metadata.referenced[0].objectType).to.equal('message');
                expect(meta.metadata.referenced[0].id + '').to.equal(message._id + '');
                done();
              });
            });
          });
        });
      });
    });
  });

  it('should be able to post a whatsup message with a parser', function(done) {
    var Whatsup = this.mongoose.model('Whatsup');

    var message = 'Hey Oh, let\'s go!';
    var target = {
      objectType: 'activitystream',
      id: community.activity_stream.uuid
    };

    this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
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
});
