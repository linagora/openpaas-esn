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
  var tmpPath = path.resolve(basePath, 'tmp');
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

    createCommunity: function(title, creator, domain, opts, done) {
      if (opts && !done) {
        done = opts;
        opts = null;
      }
      var Community = require('mongoose').model('Community');
      var json = {
        title: title,
        type: 'open',
        creator: creator._id || creator,
        domain_ids: [domain._id || domain],
        members: [{user: creator._id}]
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

