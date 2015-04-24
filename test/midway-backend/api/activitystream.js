'use strict';

var expect = require('chai').expect,
  request = require('supertest'),
  uuid = require('node-uuid'),
  mockery = require('mockery');

describe('The activitystreams API', function() {
  var app;
  var password = 'secret';

  before(function() {
    this.helpers.requireBackend('core/db/mongo/models/domain');
    this.helpers.requireBackend('core/db/mongo/models/user');
    this.helpers.requireBackend('core/db/mongo/models/timelineentry');
  });

  beforeEach(function() {
    this.mongoose = require('mongoose');
  });

  afterEach(function(done) {
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });

  describe('Tests', function() {

    beforeEach(function(done) {
      var self = this;
      this.testEnv.initCore(function(err) {
        expect(err).to.not.exist;
        app = self.helpers.requireBackend('webserver').webserver.application;
        done();
      });
    });

    describe('Activity Stream tests', function() {
      var Domain, User, TimelineEntry, Community;
      var activitystreamId, savedTimelineEntry, community, privateCommunity, privateActivitystreamId;
      var user, userNotInPrivateCommunity;
      var email = 'itadmin@lng.net';
      password = 'secret';

      beforeEach(function(done) {
        Domain = this.mongoose.model('Domain');
        User = this.mongoose.model('User');
        TimelineEntry = this.mongoose.model('TimelineEntry');
        Community = this.mongoose.model('Community');
        this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
          user = models.users[0];
          userNotInPrivateCommunity = models.users[2];
          community = models.communities[0];
          privateCommunity = models.communities[1];
          activitystreamId = models.communities[0].activity_stream.uuid;
          privateActivitystreamId = privateCommunity.activity_stream.uuid;
          var timelineentryJSON = {
            actor: {
              objectType: 'user',
              _id: user._id
            },
            object: {
              _id: user._id
            },
            target: [
              {objectType: 'activitystream', _id: activitystreamId}
            ]
          };
          var timelineEntry = new TimelineEntry(timelineentryJSON);
          timelineEntry.save(function(err, saved) {
            expect(err).to.not.exist;
            savedTimelineEntry = saved;
            done();
          });
        });
      });

      describe('GET /api/activitystreams/:uuid', function(done) {

        it('should send back 401 when not logged in', function(done) {
          this.helpers.api.requireLogin(app, 'get', '/api/activitystreams/' + activitystreamId, done);
        });

        it('should send back 404 when the activity stream does not exist', function(done) {
          var incorrectUUID = uuid.v4();
          this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
            expect(err).to.not.exist;
            loggedInAsUser(request(app).get('/api/activitystreams/' + incorrectUUID))
              .expect(404, done);
          });
        });

        it('should send back 400 when limit parameter is incorrect', function(done) {
          this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
            expect(err).to.not.exist;
            loggedInAsUser(request(app).get('/api/activitystreams/' + activitystreamId + '?limit=-12'))
              .expect(400, done);
          });
        });

        it('should send back 400 when "before" parameter is incorrect', function(done) {
          var date = new Date();
          date.setDate(date.getDate() - 1);
          this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
            expect(err).to.not.exist;
            loggedInAsUser(request(app).get('/api/activitystreams/' + activitystreamId + '?before=pipo'))
              .expect(400, done);
          });
        });

        it('should send back 400 when "after" parameter is incorrect', function(done) {
          var date = new Date();
          date.setDate(date.getDate() - 1);
          this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
            expect(err).to.not.exist;
            loggedInAsUser(request(app).get('/api/activitystreams/' + activitystreamId + '?after=pipo'))
              .expect(400, done);
          });
        });

        it('should send back 200 when the activity stream exists but not send back timeline entries in private community', function(done) {
          var self = this;

          var timelineentryPrivate = {
            actor: {
              objectType: 'user',
              _id: user._id
            },
            object: {
              _id: user._id
            },
            target: [
              {objectType: 'activitystream', _id: privateActivitystreamId}
            ]
          };
          var timelineEntry = new TimelineEntry(timelineentryPrivate);
          timelineEntry.save(function(err, timelineEntryPrivateSaved) {
            expect(err).to.not.exist;

            self.helpers.api.loginAsUser(app, userNotInPrivateCommunity.emails[0], password, function(err, loggedInAsUser) {
              expect(err).to.not.exist;

              var req = loggedInAsUser(request(app).get('/api/activitystreams/' + privateActivitystreamId + '?limit=10'));
              req.expect(200);
              req.end(function(err, res) {
                expect(err).to.not.exist;

                var entryArray = res.body;
                expect(entryArray).to.be.not.null;
                expect(entryArray).to.have.length(0);
                done();
              });
            });
          });
        });

        it('should send back 200 when activitystream exists with timeline entries', function(done) {
          this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
            expect(err).to.not.exist;
            loggedInAsUser(request(app).get('/api/activitystreams/' + activitystreamId + '?limit=10'))
              .expect(200).end(function(err, res) {
                expect(err).to.not.exist;

                var entryArray = res.body;
                expect(entryArray).to.be.not.null;
                expect(entryArray).to.have.length(1);

                var expectedEntry = {
                  actor: {
                    _id: user._id.toString(),
                    objectType: 'user'
                  },
                  target: [{
                    _id: activitystreamId,
                    objectType: 'activitystream'
                  }]
                };
                expect(entryArray[0]).to.shallowDeepEqual(expectedEntry);
                done();
              });
          });
        });
      });

      describe('GET /api/activitystreams/:uuid/resource', function() {

        it('should send back 401 when not logged in', function(done) {
          this.helpers.api.requireLogin(app, 'get', '/api/activitystreams/' + activitystreamId + '/resource', done);
        });

        it('should send back 404 when the activity stream does not exist', function(done) {
          var incorrectUUID = uuid.v4();
          this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
            expect(err).to.not.exist;
            loggedInAsUser(request(app).get('/api/activitystreams/' + incorrectUUID + '/resource'))
              .expect(404, done);
          });
        });

        it('should send back 200 with activity stream associated resource', function(done) {
          var self = this;
          this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
            expect(err).to.not.exist;
            loggedInAsUser(request(app).get('/api/activitystreams/' + activitystreamId + '/resource'))
              .expect(200).end(function(err, res) {
                expect(err).to.not.exist;

                var expectedObject = {
                  objectType: 'community',
                  object: self.helpers.toComparableObject(community)
                };

                expect(res.body).to.shallowDeepEqual(expectedObject);
                done();
              });
          });
        });
      });
    });

    describe('Tracker tests', function() {
      var domain;
      var community;
      var user;
      var user2;
      var activitystreamId;

      beforeEach(function(done) {
        var self = this;

        this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
          expect(err).to.not.exist;

          domain = models.domain;
          user = models.users[0];
          user2 = models.users[1];

          self.helpers.api.createCommunity('Node', user, domain, function(err, saved) {
            expect(err).to.not.exist;
            activitystreamId = saved.activity_stream.uuid;
            community = saved;
            done();
          });
        });
      });

      describe('GET /api/activitystreams/:uuid/unreadcount', function() {

        it('should send back 401 when not logged in', function(done) {
          this.helpers.api.requireLogin(app, 'get', '/api/activitystreams/' + activitystreamId + '/unreadcount', done);
        });

        it('should send back 404 if the activity stream is not found', function(done) {
          this.helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
            loggedInAsUser(request(app).get('/api/activitystreams/178629182-19278128/unreadcount'))
              .expect(404, done);
          });
        });

        it('should send back 200 with 0 unread timeline entries when get the number for the first time', function(done) {
          this.helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
            var req = loggedInAsUser(request(app).get('/api/activitystreams/' + activitystreamId + '/unreadcount'));
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;

              var expectedObject = {
                _id: activitystreamId,
                unread_count: 0
              };

              expect(res.body).to.shallowDeepEqual(expectedObject);
              done();
            });
          });
        });
      });

      it('should send back 200 with 3 unread timeline entries', function(done) {
        var self = this;

        // Login
        this.helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
          // Add one Timeline Entry
          self.helpers.api.applyMultipleTimelineEntries(activitystreamId, 1, 'post', function(err, models) {
            expect(err).to.not.exist;

            // Get the Activity Stream (will update the last unread Timeline Entry)
            var req = loggedInAsUser(request(app).get('/api/activitystreams/' + activitystreamId));
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;

              // Add 3 new Timeline Entries
              self.helpers.api.applyMultipleTimelineEntries(activitystreamId, 3, 'post', function(err, models) {
                expect(err).to.not.exist;

                // Get the number of unread Timeline Entries
                req = loggedInAsUser(request(app).get(
                    '/api/activitystreams/' + activitystreamId + '/unreadcount'));
                req.expect(200);
                req.end(function(err, res) {
                  expect(err).to.not.exist;

                  var expectedObject = {
                    _id: activitystreamId,
                    unread_count: 3
                  };

                  expect(res.body).to.shallowDeepEqual(expectedObject);
                  done();
                });
              });
            });
          });
        });
      });

      describe('when there is an update timelineentry', function() {
        it('should send back 200 with 3 unread timeline entries', function(done) {
          var self = this;

          // Login
          this.helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
            // Add one Timeline Entry
            self.helpers.api.applyMultipleTimelineEntries(activitystreamId, 1, 'post', function(err, models) {
              expect(err).to.not.exist;

              // Get the Activity Stream (will update the last unread Timeline Entry)
              var req = loggedInAsUser(request(app).get('/api/activitystreams/' + activitystreamId));
              req.expect(200);
              req.end(function(err, res) {
                expect(err).to.not.exist;

                // Add 3 new Timeline Entries
                self.helpers.api.applyMultipleTimelineEntries(activitystreamId, 3, 'post', function(err, models) {
                  expect(err).to.not.exist;
                  // add an update on the second timeline entry
                  self.helpers.api.recordNextTimelineEntry(models.timelineEntries[1], 'update', function(err, model) {
                    expect(err).to.not.exist;
                    // Get the number of unread Timeline Entries
                    req = loggedInAsUser(request(app).get(
                      '/api/activitystreams/' + activitystreamId + '/unreadcount'));
                    req.expect(200);
                    req.end(function(err, res) {
                      expect(err).to.not.exist;

                      var expectedObject = {
                        _id: activitystreamId,
                        unread_count: 3
                      };

                      expect(res.body).to.shallowDeepEqual(expectedObject);
                      done();
                    });
                  });
                });
              });
            });
          });
        });
      });

      it('should send back 200 with 0 unread TimelineEntry for new user in community', function(done) {
        var self = this;

        var communityCore = this.helpers.requireBackend('core/community');

        // Login
        this.helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
          // Add three Timeline Entry
          self.helpers.api.applyMultipleTimelineEntries(activitystreamId, 3, 'post', function(err, models) {
            expect(err).to.not.exist;

            // Add the second user to the community
            communityCore.join(community, user2, user2, 'user', function(err, updated) {
              expect(err).to.not.exist;

              self.helpers.api.loginAsUser(app, user2.emails[0], password, function(err, loggedInAsUser2) {
                // Get the number of unread Timeline Entries for the second user
                var req = loggedInAsUser2(request(app).get(
                    '/api/activitystreams/' + activitystreamId + '/unreadcount'));
                req.expect(200);
                req.end(function(err, res) {
                  expect(err).to.not.exist;

                  var expectedObject = {
                    _id: activitystreamId,
                    unread_count: 0
                  };

                  expect(res.body).to.shallowDeepEqual(expectedObject);
                  done();
                });
              });
            });
          });
        });
      });

      it('should send back 200 with 3 unread timeline entries ' +
        'when there are 4 timeline entries but with 1 own by the user', function(done) {
        var self = this;

        var TimelineEntry = this.mongoose.model('TimelineEntry');

        // Login
        this.helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
          // Add one Timeline Entry (helper is not used because we must set a user id)
          new TimelineEntry({
            verb: 'post',
            language: 'en',
            actor: {
              objectType: 'user',
              _id: user._id,
              image: '123456789',
              displayName: 'foo bar baz'
            },
            object: {
              objectType: 'message',
              _id: self.mongoose.Types.ObjectId()
            },
            target: [
              {
                objectType: 'activitystream',
                _id: activitystreamId
              }
            ]
          }).save(function(err, saved) {
              expect(err).to.not.exist;

              // Add 3 new Timeline Entries
              self.helpers.api.applyMultipleTimelineEntries(activitystreamId, 3, 'post', function(err, models) {
                expect(err).to.not.exist;

                // Get the number of unread Timeline Entries
                var req = loggedInAsUser(request(app).get(
                    '/api/activitystreams/' + activitystreamId + '/unreadcount'));
                req.expect(200);
                req.end(function(err, res) {
                  expect(err).to.not.exist;

                  var expectedObject = {
                    _id: activitystreamId,
                    unread_count: 3
                  };

                  expect(res.body).to.shallowDeepEqual(expectedObject);
                  done();
                });
              });
            });
        });
      });
    });
  });

  describe('Mock Tests', function() {
    var user;
    var domain;
    var tracker;
    var activitystreamId;

    beforeEach(function(done) {
      tracker = {
        countSinceLastTimelineEntry: function(userId, activityStreamUuid, callback) {
          return callback(new Error('server error'));
        }
      };
      mockery.registerMock('../../core/activitystreams/tracker', {getTracker: function() {return tracker;}});

      var self = this;
      this.testEnv.initCore(function(err) {
        expect(err).to.not.exist;
        app = self.helpers.requireBackend('webserver').webserver.application;

        self.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
          expect(err).to.not.exist;

          domain = models.domain;
          user = models.users[0];

          self.helpers.api.createCommunity('Node', user, domain, function(err, saved) {
            expect(err).to.not.exist;
            activitystreamId = saved.activity_stream.uuid;
            done();
          });
        });
      });
    });

    it('should send back 500 if server error', function(done) {
      this.helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
        loggedInAsUser(request(app).get('/api/activitystreams/' + activitystreamId + '/unreadcount'))
          .expect(500, done);
      });
    });
  });
});
