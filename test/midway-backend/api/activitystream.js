'use strict';

var expect = require('chai').expect,
  request = require('supertest'),
  uuid = require('node-uuid'),
  mockery = require('mockery'),
  async = require('async');

describe('The activitystreams routes', function() {
  var webserver;
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
        if (err) { done(err); }
        webserver = self.helpers.requireBackend('webserver').webserver;
        done();
      });
    });

    describe('Activity Stream tests', function() {
      var Domain, User, TimelineEntry, Community;
      var activitystreamId, savedTimelineEntry, community, privateCommunity, privateActivitystreamId;
      var user, userNotInPrivateCommunity, userExternal;
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
          userExternal = models.users[3];
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
            if (err) { done(err); }
            savedTimelineEntry = saved;
            done();
          });
        });
      });

      describe('GET /api/activitystreams/:uuid', function(done) {

        it('should return a JSON with 404 result when activitystream does not exist', function(done) {
          var incorrectUUID = uuid.v4();
          request(webserver.application)
            .post('/api/login')
            .send({username: email, password: password, rememberme: false})
            .expect(200)
            .end(function(err, res) {
              var cookies = res.headers['set-cookie'].pop().split(';')[0];
              var req = request(webserver.application).get('/api/activitystreams/' + incorrectUUID);
              req.cookies = cookies;
              req.expect(404).end(function(err, res) {
                expect(err).to.be.null;
                done();
              });
            });
        });

        it('should return a JSON with 400 result when limit parameter is incorrect', function(done) {
          request(webserver.application)
            .post('/api/login')
            .send({username: email, password: password, rememberme: false})
            .expect(200)
            .end(function(err, res) {
              var cookies = res.headers['set-cookie'].pop().split(';')[0];
              var req = request(webserver.application).get('/api/activitystreams/' + activitystreamId + '?limit=-12');
              req.cookies = cookies;
              req.expect(400).end(function(err, res) {
                expect(err).to.not.exist;
                done();
              });
            });
        });

        it('should return a JSON with 400 result when "before" parameter is incorrect', function(done) {
          var date = new Date();
          date.setDate(date.getDate() - 1);
          request(webserver.application)
            .post('/api/login')
            .send({username: email, password: password, rememberme: false})
            .expect(200)
            .end(function(err, res) {
              var cookies = res.headers['set-cookie'].pop().split(';')[0];
              var req = request(webserver.application).get('/api/activitystreams/' + activitystreamId + '?before=pipo');
              req.cookies = cookies;
              req.expect(400).end(function(err, res) {
                expect(err).to.not.exist;
                done();
              });
            });
        });

        it('should return a JSON with 400 result when "after" parameter is incorrect', function(done) {
          var date = new Date();
          date.setDate(date.getDate() - 1);
          request(webserver.application)
            .post('/api/login')
            .send({username: email, password: password, rememberme: false})
            .expect(200)
            .end(function(err, res) {
              var cookies = res.headers['set-cookie'].pop().split(';')[0];
              var req = request(webserver.application).get('/api/activitystreams/' + activitystreamId + '?after=pipo');
              req.cookies = cookies;
              req.expect(400).end(function(err, res) {
                expect(err).to.not.exist;
                done();
              });
            });
        });

        it('should return a JSON with 200 result when activitystream exists and not return timeline entries in private community', function(done) {
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
            if (err) { return done(err); }

            self.helpers.api.loginAsUser(webserver.application, userNotInPrivateCommunity.emails[0], password, function(err, loggedInAsUser) {
              if (err) { return done(err); }

              var req = loggedInAsUser(request(webserver.application).get('/api/activitystreams/' + privateActivitystreamId + '?limit=10'));
              req.expect(200);
              req.end(function(err, res) {
                expect(err).to.not.exist;

                var entryArray = res.body;
                expect(entryArray).to.be.not.null;
                expect(entryArray.length).to.equal(0);
                done();
              });
            });
          });
        });

        it('should return a JSON with 200 result when activitystream exists', function(done) {
          request(webserver.application)
            .post('/api/login')
            .send({username: email, password: password, rememberme: false})
            .expect(200)
            .end(function(err, res) {
              var cookies = res.headers['set-cookie'].pop().split(';')[0];
              var req = request(webserver.application).get('/api/activitystreams/' + activitystreamId + '?limit=10');
              req.cookies = cookies;
              req.expect(200).end(function(err, res) {
                expect(err).to.not.exist;

                var entryArray = res.body;
                expect(entryArray).to.be.not.null;
                expect(entryArray.length).to.equal(1);

                var entry = entryArray[0];
                expect(entry.actor).to.be.not.null;
                expect(entry.actor.objectType).to.equal('user');
                expect(entry.target).to.be.not.null;
                expect(entry.target.length).to.equal(1);
                expect(entry.target[0].objectType).to.equal('activitystream');
                expect(entry.target[0]._id).to.equal(activitystreamId);

                done();
              });
            });
        });

        it('should return a JSON with 200 result when activitystream exists and not return timeline entries where' +
        ' an external user have not his company in the "to" field', function(done) {
          var self = this;

          var timelineentryForLinagoraCompany = {
            actor: {
              objectType: 'user',
              _id: user._id
            },
            object: {
              objectType: 'organizational',
              _id: user._id
            },
            target: [
              {objectType: 'activitystream', _id: activitystreamId}
            ],
            to: [
              {objectType: 'company', id: 'linagora.com'}
            ]
          };
          var timelineentryForAwesomeCompany = {
            actor: {
              objectType: 'user',
              _id: user._id
            },
            object: {
              objectType: 'organizational',
              _id: user._id
            },
            target: [
              {objectType: 'activitystream', _id: activitystreamId}
            ],
            to: [
              {objectType: 'company', id: 'awesome.io'}
            ]
          };
          async.series([
            function(callback) {
              community.members.push({member: {objectType: 'user', id: userExternal._id}});
              community.markModified('members');
              community.save(callback);
            },
            function(callback) {
              var timelineEntry = new TimelineEntry(timelineentryForLinagoraCompany);
              timelineEntry.save(callback);
            },
            function(callback) {
              var timelineEntry = new TimelineEntry(timelineentryForAwesomeCompany);
              timelineEntry.save(callback);
            }
          ], function(err, results) {
            if (err) {
              return done(err);
            }
            timelineentryForLinagoraCompany = results[1][0];
            timelineentryForAwesomeCompany = results[2][0];
            self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
              if (err) { return done(err); }

              var req = loggedInAsUser(request(webserver.application).get('/api/activitystreams/' + activitystreamId + '?limit=10'));
              req.expect(200);
              req.end(function(err, res) {
                expect(err).to.not.exist;
                var entryArray = res.body;
                expect(entryArray).to.be.not.null;
                expect(entryArray.length).to.equal(3);
                expect(entryArray[0]._id.toString()).to.equal(timelineentryForAwesomeCompany._id.toString());
                expect(entryArray[1]._id.toString()).to.equal(timelineentryForLinagoraCompany._id.toString());
                expect(entryArray[2]._id.toString()).to.equal(savedTimelineEntry._id.toString());

                self.helpers.api.loginAsUser(webserver.application, userExternal.emails[0], password, function(err, loggedInAsUserExternal) {
                  if (err) { return done(err); }

                  var req = loggedInAsUserExternal(request(webserver.application).get('/api/activitystreams/' + activitystreamId + '?limit=10'));
                  req.expect(200);
                  req.end(function(err, res) {
                    expect(err).to.not.exist;
                    var entryArray = res.body;
                    expect(entryArray).to.be.not.null;
                    expect(entryArray.length).to.equal(2);
                    expect(entryArray[0]._id.toString()).to.equal(timelineentryForLinagoraCompany._id.toString());
                    expect(entryArray[1]._id.toString()).to.equal(savedTimelineEntry._id.toString());

                    done();
                  });
                });
              });
            });
          });
        });
      });

      describe('GET /api/activitystreams/:uuid/resource', function() {
        it('should return 400 when activitystream does not exist', function(done) {
          var incorrectUUID = uuid.v4();
          request(webserver.application)
            .post('/api/login')
            .send({username: email, password: password, rememberme: false})
            .expect(200)
            .end(function(err, res) {
              var cookies = res.headers['set-cookie'].pop().split(';')[0];
              var req = request(webserver.application).get('/api/activitystreams/' + incorrectUUID + '/resource');
              req.cookies = cookies;
              req.expect(400).end(function(err, res) {
                expect(err).to.be.null;
                done();
              });
            });
        });

        it('should return 200 whit activitystream associated resource', function(done) {
          request(webserver.application)
            .post('/api/login')
            .send({username: email, password: password, rememberme: false})
            .expect(200)
            .end(function(err, res) {
              var cookies = res.headers['set-cookie'].pop().split(';')[0];
              var req = request(webserver.application).get('/api/activitystreams/' + activitystreamId + '/resource');
              req.cookies = cookies;
              req.expect(200).end(function(err, res) {
                expect(err).to.be.null;
                expect(res.body.objectType).to.exist;
                expect(res.body.objectType).to.equal('community');
                var returnedComm = res.body.object;
                expect(returnedComm._id).to.equal(community._id + '');
                expect(returnedComm.activity_stream.uuid).to.equal(activitystreamId);
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
          if (err) { done(err); }

          domain = models.domain;
          user = models.users[0];
          user2 = models.users[1];

          self.helpers.api.createCommunity('Node', user, domain, function(err, saved) {
            if (err) {
              return done(err);
            }
            activitystreamId = saved.activity_stream.uuid;
            community = saved;
            done();
          });
        });
      });

      it('should return 404 if the activity stream is not found', function(done) {
        this.helpers.api.loginAsUser(webserver.application, user.emails[0], password, function(err, loggedInAsUser) {
          var req = loggedInAsUser(request(webserver.application).get(
            '/api/activitystreams/178629182-19278128/unreadcount'));
          req.expect(404);
          req.end(done);
        });
      });

      it('should return 0 unread timeline entries when get the number for the first time', function(done) {
        this.helpers.api.loginAsUser(webserver.application, user.emails[0], password, function(err, loggedInAsUser) {
          var req = loggedInAsUser(request(webserver.application).get(
              '/api/activitystreams/' + activitystreamId + '/unreadcount'));
          req.expect(200);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body._id).to.deep.equal(activitystreamId);
            expect(res.body.unread_count).to.deep.equal(0);
            done();
          });
        });
      });

      it('should return 3 unread timeline entries', function(done) {
        var self = this;

        // Login
        this.helpers.api.loginAsUser(webserver.application, user.emails[0], password, function(err, loggedInAsUser) {
          // Add one Timeline Entry
          self.helpers.api.applyMultipleTimelineEntries(activitystreamId, 1, 'post', function(err, models) {
            if (err) { done(err); }

            // Get the Activity Stream (will update the last unread Timeline Entry)
            var req = loggedInAsUser(request(webserver.application).get('/api/activitystreams/' + activitystreamId));
            req.expect(200);
            req.end(function(err, res) {
              if (err) { done(err); }

              // Add 3 new Timeline Entries
              self.helpers.api.applyMultipleTimelineEntries(activitystreamId, 3, 'post', function(err, models) {
                if (err) { done(err); }

                // Get the number of unread Timeline Entries
                req = loggedInAsUser(request(webserver.application).get(
                    '/api/activitystreams/' + activitystreamId + '/unreadcount'));
                req.expect(200);
                req.end(function(err, res) {
                  expect(err).to.not.exist;
                  expect(res.body).to.exist;
                  expect(res.body._id).to.deep.equal(activitystreamId);
                  expect(res.body.unread_count).to.deep.equal(3);
                  done();
                });
              });
            });
          });
        });
      });

      describe('when there is an update timelineentry', function() {
        it('should return 3 unread timeline entries', function(done) {
          var self = this;

          // Login
          this.helpers.api.loginAsUser(webserver.application, user.emails[0], password, function(err, loggedInAsUser) {
            // Add one Timeline Entry
            self.helpers.api.applyMultipleTimelineEntries(activitystreamId, 1, 'post', function(err, models) {
              if (err) { return done(err); }

              // Get the Activity Stream (will update the last unread Timeline Entry)
              var req = loggedInAsUser(request(webserver.application).get('/api/activitystreams/' + activitystreamId));
              req.expect(200);
              req.end(function(err, res) {
                if (err) { return done(err); }

                // Add 3 new Timeline Entries
                self.helpers.api.applyMultipleTimelineEntries(activitystreamId, 3, 'post', function(err, models) {
                  if (err) { return done(err); }
                  // add an update on the second timeline entry
                  self.helpers.api.recordNextTimelineEntry(models.timelineEntries[1], 'update', function(err, model) {
                    if (err) {
                      return done(err);
                    }
                    // Get the number of unread Timeline Entries
                    req = loggedInAsUser(request(webserver.application).get(
                      '/api/activitystreams/' + activitystreamId + '/unreadcount'));
                    req.expect(200);
                    req.end(function(err, res) {
                      expect(err).to.not.exist;
                      expect(res.body).to.exist;
                      expect(res.body._id).to.deep.equal(activitystreamId);
                      expect(res.body.unread_count).to.equal(3);
                      done();
                    });
                  });
                });
              });
            });
          });
        });
      });

      it('should return 0 unread TimelineEntry for new user in community', function(done) {
        var self = this;

        var communityCore = this.helpers.requireBackend('core/community');

        // Login
        this.helpers.api.loginAsUser(webserver.application, user.emails[0], password, function(err, loggedInAsUser) {
          // Add three Timeline Entry
          self.helpers.api.applyMultipleTimelineEntries(activitystreamId, 3, 'post', function(err, models) {
            if (err) { done(err); }

            // Add the second user to the community
            communityCore.join(community, user2, user2, 'user', function(err, updated) {
              if (err) { done(err); }

              self.helpers.api.loginAsUser(webserver.application, user2.emails[0], password, function(err, loggedInAsUser2) {
                // Get the number of unread Timeline Entries for the second user
                var req = loggedInAsUser2(request(webserver.application).get(
                    '/api/activitystreams/' + activitystreamId + '/unreadcount'));
                req.expect(200);
                req.end(function(err, res) {
                  expect(err).to.not.exist;
                  expect(res.body).to.exist;
                  expect(res.body._id).to.deep.equal(activitystreamId);
                  expect(res.body.unread_count).to.deep.equal(0);
                  done();
                });
              });
            });
          });
        });
      });

      it('should return 3 unread timeline entries ' +
        'when there are 4 timeline entries but with 1 own by the user', function(done) {
        var self = this;

        var TimelineEntry = this.mongoose.model('TimelineEntry');

        // Login
        this.helpers.api.loginAsUser(webserver.application, user.emails[0], password, function(err, loggedInAsUser) {
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
              if (err) { done(err); }

              // Add 3 new Timeline Entries
              self.helpers.api.applyMultipleTimelineEntries(activitystreamId, 3, 'post', function(err, models) {
                if (err) { done(err); }

                // Get the number of unread Timeline Entries
                var req = loggedInAsUser(request(webserver.application).get(
                    '/api/activitystreams/' + activitystreamId + '/unreadcount'));
                req.expect(200);
                req.end(function(err, res) {
                  expect(err).to.not.exist;
                  expect(res.body).to.exist;
                  expect(res.body._id).to.deep.equal(activitystreamId);
                  expect(res.body.unread_count).to.deep.equal(3);
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
        getUnreadTimelineEntriesCount: function(userId, activityStreamUuid, callback) {
          return callback(new Error('server error'));
        }
      };
      mockery.registerMock('../../core/activitystreams/tracker', tracker);

      var self = this;
      this.testEnv.initCore(function(err) {
        if (err) { done(err); }
        webserver = self.helpers.requireBackend('webserver').webserver;

        self.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
          if (err) { done(err); }

          domain = models.domain;
          user = models.users[0];

          self.helpers.api.createCommunity('Node', user, domain, function(err, saved) {
            if (err) {
              return done(err);
            }
            activitystreamId = saved.activity_stream.uuid;
            done();
          });
        });
      });
    });

    it('should return 500 if server error', function(done) {
      this.helpers.api.loginAsUser(webserver.application, user.emails[0], password, function(err, loggedInAsUser) {
        var req = loggedInAsUser(request(webserver.application).get(
            '/api/activitystreams/' + activitystreamId + '/unreadcount'));
        req.expect(500);
        req.end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.body.error.code).to.deep.equal(500);
          done();
        });
      });
    });
  });
});
