const { expect } = require('chai');
const request = require('supertest');
const q = require('q');

describe('The timelineentries API', function() {
  const ENDPOINT = '/api/timelineentries';
  let user, user2, message, message2, simulatedCollaboration, email, app, helpers;

  beforeEach(function(done) {
    const self = this;

    helpers = this.helpers;
    this.mongoose = require('mongoose');
    self.testEnv.initCore(function() {
      app = helpers.requireBackend('webserver').webserver.application;
      const Whatsup = helpers.requireBackend('core/db/mongo/models/whatsup');

      function saveMessage(message) {
        return message.save()
          .then(saved => {
            message._id = saved._id;

            return saved;
          });
      }

      helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) {
          return done(err);
        }
        user = models.users[0];
        user2 = models.users[1];
        simulatedCollaboration = models.simulatedCollaborations[0];
        email = user.emails[0];

        message = new Whatsup({
          author: user._id,
          content: 'This is my message',
          objectType: 'whatsup',
          shares: [{
            objectType: 'activitystream',
            id: simulatedCollaboration.activity_stream.uuid
          }]
        });

        message2 = new Whatsup({
          author: user2._id,
          content: 'This is another message',
          objectType: 'whatsup',
          shares: [{
            objectType: 'activitystream',
            id: simulatedCollaboration.activity_stream.uuid
          }]
        });

        Promise.all([saveMessage(message), saveMessage(message2)]).then(function() {
          done();
        }, done);
      });
    });
  });

  afterEach(function(done) {
    this.mongoose.connection.db
      .dropDatabase(helpers.callbacks.noErrorAnd(() => this.mongoose.disconnect(done)));
  });

  describe('GET /api/user/timelineentries', function() {
    beforeEach(function() {
      const asModule = helpers.requireBackend('core/activitystreams');

      this.createTimelineEntry = function(entry) {
        return q.denodeify(asModule.addTimelineEntry)(entry);
      };
    });

    it('should send back 401 when not logged in', function(done) {
      helpers.api.requireLogin(app, 'get', ENDPOINT, done);
    });

    it('should send back the current user timeline entries', function(done) {
      const self = this;

      function check() {
        helpers.api.loginAsUser(app, email, 'secret', helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
          loggedInAsUser(request(app)
            .get(ENDPOINT))
            .query()
            .expect(200)
            .end(helpers.callbacks.noErrorAnd(function(res) {
              expect(res.body).to.shallowDeepEqual([
                {
                  verb: 'follow',
                  actor: {
                    _id: String(user._id),
                    objectType: 'user'
                  },
                  object: {
                    _id: String(user2._id),
                    objectType: 'user'
                  }
                },
                {
                  verb: 'like',
                  actor: {
                    _id: String(user._id),
                    objectType: 'user'
                  },
                  object: {
                    _id: String(message2._id),
                    objectType: message2.objectType
                  }
                },
                {
                  verb: 'post',
                  actor: {
                    _id: String(user._id),
                    objectType: 'user'
                  },
                  object: {
                    _id: String(message._id),
                    objectType: message.objectType
                  }
                }
              ]);
              expect(res.body[0].object.displayName).to.be.defined;
              done();
            }));
        }));
      }

      var date = new Date();

      Promise.all([
        self.createTimelineEntry({published: new Date(date.setSeconds(10)), verb: 'post', actor: {objectType: 'user', _id: String(user._id)}, object: {objectType: 'whatsup', _id: String(message._id)}}),
        self.createTimelineEntry({published: new Date(date.setSeconds(15)), verb: 'like', actor: {objectType: 'user', _id: String(user._id)}, object: {objectType: 'whatsup', _id: String(message2._id)}}),
        self.createTimelineEntry({published: new Date(date.setSeconds(20)), verb: 'like', actor: {objectType: 'user', _id: String(user2._id)}, object: {objectType: 'whatsup', _id: String(message._id)}}),
        self.createTimelineEntry({published: new Date(date.setSeconds(25)), verb: 'follow', actor: {objectType: 'user', _id: String(user._id)}, object: {objectType: 'user', _id: String(user2._id)}, target: [{objectType: 'user', _id: String(user2._id)}]}),
        self.createTimelineEntry({published: new Date(date.setSeconds(30)), verb: 'foo', actor: {objectType: 'user', _id: String(user2._id)}, object: {objectType: 'user', _id: String(user2._id)}}),
        self.createTimelineEntry({published: new Date(date.setSeconds(35)), verb: 'bar', actor: {objectType: 'user', _id: String(user2._id)}, object: {objectType: 'user', _id: String(user2._id)}})
      ]).then(check, done);

    });

    describe('When following users', function() {
      beforeEach(function() {
        const followModule = helpers.requireBackend('core/user/follow');

        this.followUser = function(userA, userB) {
          return followModule.follow(userA, userB);
        };
      });

      it('should send back the denormalized timelineentries containing the user followed by a user', function(done) {
        var self = this;
        var verb = 'follow';

        function check() {

          process.nextTick(function() {
            helpers.api.loginAsUser(app, email, 'secret', helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
              loggedInAsUser(request(app)
                .get(ENDPOINT))
                .query({verb: verb})
                .expect(200)
                .end(helpers.callbacks.noErrorAnd(function(res) {
                  expect(res.body).to.shallowDeepEqual([
                    {
                      verb: verb,
                      actor: {
                        _id: String(user._id),
                        objectType: 'user'
                      },
                      object: {
                        _id: String(user2._id),
                        objectType: 'user'
                      }
                    }
                  ]);
                  expect(res.body[0].object.displayName).to.be.defined;
                  done();
                }));
            }));
          });
        }

        self.followUser(user, user2)
          .then(check)
          .catch(done);
      });
    });

    describe('When unfollowing users', function() {
      beforeEach(function(done) {
        const followModule = helpers.requireBackend('core/user/follow');

        this.unfollowUser = function(userA, userB) {
          return followModule.unfollow(userA, userB);
        };

        followModule.follow(user, user2).then(function() {
          done();
        }, done);
      });

      it('should send back the denormalized timelineentries containing the user unfollowed by a user', function(done) {
        const self = this;
        const verb = 'unfollow';

        function check() {
          process.nextTick(function() {
            helpers.api.loginAsUser(app, email, 'secret', helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
              loggedInAsUser(request(app)
                .get(ENDPOINT))
                .query({verb: verb})
                .expect(200)
                .end(helpers.callbacks.noErrorAnd(function(res) {
                  expect(res.body).to.shallowDeepEqual([
                    {
                      verb: verb,
                      actor: {
                        _id: String(user._id),
                        objectType: 'user'
                      },
                      object: {
                        _id: String(user2._id),
                        objectType: 'user'
                      }
                    }
                  ]);
                  expect(res.body[0].object.displayName).to.be.defined;
                  done();
                }));
            }));
          });
        }

        self.unfollowUser(user, user2)
          .then(check)
          .catch(done);
      });
    });

    describe('When liking messages', function() {
      beforeEach(function() {
        const likeModule = helpers.requireBackend('core/like');

        this.likeMessage = function(user, message) {
          return likeModule.like({objectType: 'user', id: String(user._id)}, {objectType: 'esn.message', id: String(message._id)});
        };
      });

      it('should send back the timelineentries containing the messages liked by a user', function(done) {
        const self = this;
        const verb = 'like';

        function check() {
          process.nextTick(function() {
            helpers.api.loginAsUser(app, email, 'secret', helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
              loggedInAsUser(request(app)
                .get(ENDPOINT))
                .query({verb: verb})
                .expect(200)
                .end(helpers.callbacks.noErrorAnd(function(res) {
                  expect(res.body).to.shallowDeepEqual([
                    {
                      verb: verb,
                      actor: {
                        _id: String(user._id),
                        objectType: 'user'
                      },
                      object: {
                        _id: String(message2._id),
                        objectType: message2.objectType
                      }
                    },
                    {
                      verb: verb,
                      actor: {
                        _id: String(user._id),
                        objectType: 'user'
                      },
                      object: {
                        _id: String(message._id),
                        objectType: message.objectType
                      }
                    }
                  ]);
                  done();
                }));
            }));
          });
        }

        self.likeMessage(user, message)
          .then(function() {
            return self.likeMessage(user, message2);
          })
          .then(function() {
            return self.likeMessage(user2, message2);
          })
          .then(check)
          .catch(done);
      });
    });
  });
});
