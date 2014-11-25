'use strict';

var mockery = require('mockery'),
    path = require('path'),
    fs = require('fs-extra'),
    extend = require('extend'),
    helpers = require('../helpers');
var testConfig = require('../config/servers-conf.js');

before(function() {
  var self = this;
  var basePath = path.resolve(__dirname + '/../..');
  var tmpPath = path.resolve(basePath, testConfig.tmp);
  this.testEnv = {
    serversConfig: testConfig,
    basePath: basePath,
    tmp: tmpPath,
    fixtures: path.resolve(__dirname + '/fixtures'),
    mongoUrl: 'mongodb://localhost:' + testConfig.mongodb.port + '/' + testConfig.mongodb.dbname,
    redisUrl: 'redis://localhost:' + testConfig.redis.port,
    writeDBConfigFile: function() {
      fs.writeFileSync(tmpPath + '/db.json', JSON.stringify({connectionString: 'mongodb://localhost:' + testConfig.mongodb.port + '/' + testConfig.mongodb.dbname, connectionOptions: {auto_reconnect: false}}));
    },
    removeDBConfigFile: function() {
      fs.unlinkSync(tmpPath + '/db.json');
    },
    initCore: function(callback) {
      var core = require(basePath + '/backend/core');
      core.init();
      if (callback) {
        process.nextTick(callback);
      }
      return core;
    },
    initRedisConfiguration: function(mongoose, callback) {
      var configuration = require('mongoconfig');
      configuration.setDefaultMongoose(mongoose);
      mongoose.connect(this.mongoUrl);
      var self = this;

      mongoose.connection.on('open', function() {
        configuration('redis').store({url: self.redisUrl}, function(err) {
          if (err) {
            console.log('Error while saving redis configuration', err);
            return callback(err);
          }
          return callback();
        });
      });
    }
  };

  this.helpers = {};
  helpers(this.helpers, this.testEnv);

  this.helpers.api = {
    getStreamData: function(stream, callback) {
      var data = [];
      stream.on('data', function(chunk) {
        data.push(chunk);
      });
      stream.on('end', function() {
        callback(data.join(''));
      });
    },

    cleanDomainDeployment: function(models, callback) {
      require(self.testEnv.basePath + '/backend/core').db.mongo;

      var async = require('async');

      var userJobs = models.users.map(function(user) {
        return function(then) {
          user.remove(function() {
            then();
          });
        };
      });

      async.parallel(userJobs, function(err) {
        models.domain.remove(function() {
          callback();
        });
      });

    },
    /**
    * This enables deployments of common needed resources (domain, users)
    * using defined fixtures.
    * Currently it supports for each fixture the creation of one domain,
    * and users belonging to this domain.
    * The first user of the list is automatically added as the domain administrator.
    *
    *
    */
applyDomainDeployment: function(name, callback) {
      var fixtures = require(self.testEnv.fixtures + '/deployments');
      if (! (name in fixtures)) {
        return callback(new Error('Unknown fixture name ' + name));
      }
      var deployment = fixtures[name]();
      require(self.testEnv.basePath + '/backend/core').db.mongo;

      var async = require('async'),
        Domain = require('mongoose').model('Domain'),
        Community = require('mongoose').model('Community'),
        User = require('mongoose').model('User');

      function createDomain(then) {
        var d = new Domain(deployment.domain);
        d.save(function(err, d) {
          if (err) {
            return then(err);
          } else {
            return then(null, d);
          }
        });
      }

      function createUsersJobs(domain) {
        var jobs = deployment.users.map(function(user) {
          return function(then) {
            var u = new User(user);
            u.save(function(err, u) {
              if (err) {
                return then(err);
              } else {
                u.joinDomain(domain, function(err) {
                  if (err) {
                    return then(err);
                  }
                  return then(null, u);
                });
              }
            });
          };
        });
        return jobs;
      }

      function createCommunityJob(c) {
        return function(then) {
          var community = extend(true, {}, c);
          var creator = models.users.filter(function(u) { return u.emails.indexOf(community.creator) >= 0; });
          if (!creator.length) {
            return then(new Error('Creator ', community.creator, 'cannot be found in domain users'));
          }
          community.creator = creator[0]._id;
          community.domain_ids = [models.domain._id];
          community.members = [{member: {objectType: 'user', id: creator[0]._id}}];
          c.members.forEach(function(m) {
            if (m.objectType !== 'user') {
              return;
            }
            var user = models.users.filter(function(u) { return u.emails.indexOf(m.id) >= 0; });
            if (!user.length) {
              return;
            }
            community.members.push({member: {objectType: 'user', id: user[0]._id}});
          });
          var communitymodel = new Community(community);
          communitymodel.save(function(err, c) {
            if (err) {
              console.log('unable to save community', err);
            }
            then(err, c);
          });
        };
      }

      function createCommunityJobs(communities) {
        return communities.map(function(c) { return createCommunityJob(c); });
      }

      var models = {};

      createDomain(function(err, domain) {
        if (err) {
          return callback(err);
        }
        async.parallel(createUsersJobs(domain), function(err, users) {
          if (err) {
            return callback(err);
          }

          models.users = users;
          domain.administrator = users[0]._id;

          domain.save(function(err) {
            if (err) {
              return callback(err);
            }

            models.domain = domain;
            if (!deployment.communities || !deployment.communities.length) {
              return callback(null, models);
            }
            async.parallel(createCommunityJobs(deployment.communities), function(err, communities) {
              if (err) {
                return callback(err);
              }
              models.communities = communities;
              return callback(null, models);
            });

          });
        });
      });
    },
    getCommunity: function(id, done) {
      var Community = require('mongoose').model('Community');
      Community.findOne({_id: id}, done);
    },
    createCommunity: function(title, creator, domain, opts, done) {
      require(basePath + '/backend/core/db/mongo/models/community');
      if (opts && !done) {
        done = opts;
        opts = null;
      }
      var Community = require('mongoose').model('Community');
      var creatorId = creator._id || creator;
      var json = {
        title: title,
        type: 'open',
        creator: creatorId,
        domain_ids: [domain._id || domain],
        members: [
          {member: {id: creatorId, objectType: 'user'}}
        ]
      };
      if (opts) {
        if (typeof opts === 'function') {
          json = opts(json);
        } else {
          extend(true, json, opts);
        }
      }
      var community = new Community(json);
      return community.save(done);
    },

    addUsersInCommunity: function(community, users, done) {
      var Community = require('mongoose').model('Community');
      var async = require('async');
      async.each(users, function(user, callback) {
        Community.update({
          _id: community._id || community
        }, {
          $push: {
            members: {
              member: {
                id: user._id || user,
                objectType: 'user',
                status: 'joined'
              }
            }
          }
        }, callback);
      }, function(err) {
        if (err) { return done(err); }
        Community.findOne({_id: community._id || community}, function(err, result) {
          if (err) { return done(err); }
          return done(null, result);
        });
      });
    },

    createConference: function(creator, attendees, done) {
      var Conference = require('mongoose').model('Conference');
      var json = {
        creator: creator._id || creator,
        attendees: attendees.map(function(attendee) {
          return {
            user: attendee._id || attendee,
            status: 'online'
          };
        })
      };
      var conference = new Conference(json);
      return conference.save(done);
    },
    /*
    * returns a function that adds authentication bits
    * for "email" user to the request.
    *
    * example:
    *     this.helpers.api.loginAsUser(app, 'bwillis@test.fr', 'secret', function(err, loginAsBWillis) {
    *       var r = logAsBWillis(request(app).get('/api/user'));
    *       r.expect(200).end(done);
    *     });
    *
    */
    loginAsUser: function(app, email, password, done) {
      var request = require('supertest');
      request(app)
      .post('/api/login')
      .send({username: email, password: password, rememberme: false})
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        var cookies = res.headers['set-cookie'].pop().split(';').shift();
        function requestWithSessionCookie(cookies) {
          return function(r) {
            r.cookies = cookies;
            return r;
          };
        }
        return done(null, requestWithSessionCookie(cookies));
      });
    },
    /**
     * Add multiple TimelineEntries to the database.
     * All TimelineEntries added are identical.
     * This call added "count" TimelineEntries to the database.
     *
     * @param {string} activityStreamUuid the target ActivityStream for each TimelineEntry
     * @param {number} count the number of TimelineEntry that must be created
     * @param {string} verb the verb field for each TimelineEntry
     * @param {function} callback fn like callback(err, models)
     */
    applyMultipleTimelineEntries: function(activityStreamUuid, count, verb, callback) {
      require(self.testEnv.basePath + '/backend/core').db.mongo;

      var async = require('async'),
        TimelineEntry = require('mongoose').model('TimelineEntry');

      function createTimelineEntry(domain, callback) {
        var e = new TimelineEntry({
          verb: verb,     // "post" or "remove"
          language: 'en',
          actor: {
            objectType: 'user',
            _id: self.mongoose.Types.ObjectId(),
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
              _id: activityStreamUuid
            }
          ]
        });
        e.save(function(err, saved) {
          if (err) { return callback(err); }
          return callback(null, e);
        });
      }

      function createTimelineEntryJob(callback) {
        createTimelineEntry(activityStreamUuid, callback);
      }

      var arrayJobs = [];
      for (var i = 0; i < count; i++) {
        arrayJobs.push(createTimelineEntryJob);
      }

      var models = {};
      models.activityStreamUuid = activityStreamUuid;

      async.parallel(arrayJobs, function(err, timelineEntries) {
        if (err) {
          return callback(err);
        }
        models.timelineEntries = timelineEntries;
        return callback(null, models);
      });
    }
  };


  process.env.NODE_CONFIG = this.testEnv.tmp;
  process.env.NODE_ENV = 'test';

  fs.copySync(this.testEnv.fixtures + '/default.mongoAuth.json', this.testEnv.tmp + '/default.json');
});

after(function() {
  try {
    fs.unlinkSync(this.testEnv.tmp + '/default.json');
  } catch (e) {}
  delete process.env.NODE_CONFIG;
  delete process.env.NODE_ENV;
});

beforeEach(function() {
  mockery.enable({warnOnReplace: false, warnOnUnregistered: false, useCleanCache: true});
  this.testEnv.writeDBConfigFile();
});

afterEach(function() {
  try {
    require(this.testEnv.basePath + '/backend/core/db/mongo/file-watcher').clear();
    this.testEnv.removeDBConfigFile();
  } catch (e) {}
  mockery.resetCache();
  mockery.deregisterAll();
  mockery.disable();
});
