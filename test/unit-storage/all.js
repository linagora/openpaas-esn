'use strict';

var mockery = require('mockery'),
    path = require('path'),
    fs = require('fs-extra'),
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
    writeDBConfigFile: function() {
      fs.writeFileSync(tmpPath + '/db.json', JSON.stringify({connectionString: 'mongodb://localhost:' + testConfig.mongodb.port + '/' + testConfig.mongodb.dbname}));
    },
    removeDBConfigFile: function() {
      fs.unlinkSync(tmpPath + '/db.json');
    },
    initCore: function(callback) {
      var core = require(basePath + '/backend/core');
      core.init();
      if (callback) {
        callback();
      }
      return core;
    }
  };
  this.helpers = {};
  helpers(this.helpers, this.testEnv);

  this.helpers.api = {
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
        User = require('mongoose').model('User');

      function createDomain(then) {
        var d = new Domain(deployment.domain);
        d.save(function(err, d) {
          if (err) {
            console.log(err, err.stack);
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
                console.log(err, err.stack);
                return then(err);
              } else {
                u.joinDomain(domain, function(err) {
                  if (err) {
                    console.log(err, err.stack);
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
            return callback(null, models);

          });
        });
      });
    },

    createCommunity: function(title, creator, domain, done) {
      var Community = require('mongoose').model('Community');
      var json = {
        title: title,
        creator: creator._id || creator,
        domain_ids: [domain._id || domain],
        members: [{user: creator._id}]
      };
      var community = new Community(json);
      return community.save(done);
    },
    addUsersInCommunity: function(community, users, done) {
      var Community = require('mongoose').model('Community');
      var async = require('async');
      async.each(users, function(user, callback) {
        Community.update({
          _id: community._id || community,
          'members.user': {$ne: user._id || user}
        }, {
          $push: {members: {user: user._id || user, status: 'joined'}}
        }, callback);
      }, function(err) {
        if (err) { return done(err); }
        Community.findOne({_id: community._id || community}, function(err, result) {
          if (err) { return done(err); }
          return done(null, result);
        });
      });
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
  fs.copySync(__dirname + '/default.test.json', this.testEnv.tmp + '/default.json');
});

after(function(done) {
  delete process.env.NODE_CONFIG;
  fs.unlinkSync(this.testEnv.tmp + '/default.json');
  this.helpers.mongo.dropDatabase(done);
});

beforeEach(function() {
  mockery.enable({warnOnReplace: false, warnOnUnregistered: false, useCleanCache: true});
  mockery.registerMock('./logger', require(this.testEnv.fixtures + '/logger-noop')());
});

afterEach(function() {
  try {
    require('mongoose').disconnect();
  } catch (e) {}
  try {
    require(this.testEnv.basePath + '/backend/core/db/mongo/file-watcher').clear();
  } catch (e) {}
  mockery.resetCache();
  mockery.deregisterAll();
  mockery.disable();
});
