'use strict';

var extend = require('extend');
var q = require('q');
var request = require('supertest');

module.exports = function(mixin, testEnv) {
  var api = {};
  mixin.api = api;
  api.getStreamData = function(stream, callback) {
    var data = [];
    stream.on('data', function(chunk) {
      data.push(chunk);
    });
    stream.on('end', function() {
      callback(data.join(''));
    });
  };

  api.cleanDomainDeployment = function(models, callback) {
    require(testEnv.basePath + '/backend/core').db.mongo;

    var async = require('async');

    var userJobs = models.users.map(function(user) {
      return function(then) {
        user.remove(function() {
          then();
        });
      };
    });

    async.parallel(userJobs, function() {
      models.domain.remove(function() {
        callback();
      });
    });

  };

  api.createUser = function(user) {
    var User = require('mongoose').model('User');
    var userHelper = require('../backend/core/user/helpers');
    return q.ninvoke(userHelper, 'saveAndIndexUser', new User(user));
  };

  /**
  * This enables deployments of common needed resources (domain, users)
  * using defined fixtures.
  * Currently it supports for each fixture the creation of one domain,
  * and users belonging to this domain.
  * The first user of the list is automatically added as the domain administrator.
  *
  *
  */
  api.applyDomainDeployment = function(name, options, callback) {
    if (!callback) {
      callback = options;
      options = {};
    }
    var fixturesPath = options.fixtures ? options.fixtures : testEnv.fixtures + '/deployments';
    var fixtures = require(fixturesPath);
    if (!(name in fixtures)) {
      return callback(new Error('Unknown fixture name ' + name));
    }
    var deployment = fixtures[name]();
    require(testEnv.basePath + '/backend/core').db.mongo;
    var self = this;
    require('mongoose').model('User');
    var Community = require('mongoose').model('Community');
    var Domain = require('mongoose').model('Domain');
    var helpers = require('../backend/core/db/mongo/plugins/helpers');
    helpers.applyCommunityPlugins();
    helpers.patchFindOneAndUpdate();

    deployment.models = {};

    var fillCollaboration = {
      user: function(models, collaboration, member) {
        if (member.objectType !== 'user') {
          return;
        }

        var user = models.users.filter(function(u) { return u.emails.indexOf(member.id) >= 0; });
        if (!user.length) {
          return;
        }
        collaboration.members.push({member: {objectType: 'user', id: user[0]._id}});
      },

      community: function(models, collaboration, member) {
        if (member.objectType !== 'community') {
          return;
        }
        var community = models.communities.filter(function(c) {
          return c.title.indexOf(member.id) >= 0;
        });

        if (!community.length) {
          throw new Error('Could not find ' + member.id);
        }
        collaboration.members.push({member: {objectType: 'community', id: community[0]._id}});
      }
    };

    function saveCollaboration(Model, models, c) {
      var collaboration = extend(true, {}, c);
      var creator = models.users.filter(function(u) { return u.emails.indexOf(collaboration.creator) >= 0; });
      if (!creator.length) {
        return q.reject(new Error('Creator ', collaboration.creator, 'cannot be found in domain users'));
      }
      collaboration.creator = creator[0]._id;
      collaboration.domain_ids = [models.domain._id];
      collaboration.members = [{member: {objectType: 'user', id: creator[0]._id}}];
      try {
        c.members.forEach(function(m) {
          fillCollaboration[m.objectType](models, collaboration, m);
        });
      } catch (err) {
        return q.reject(err);
      }

      return q.npost(new Model(collaboration), 'save').then(function(collab) {
        return collab;
      });
    }

    function createDomain() {
      var domain = extend(true, {}, deployment.domain);
      delete domain.administrators;

      return q.npost(new Domain(domain), 'save').then(function(domain) {
        deployment.models.domain = domain;
      });
    }

    function updateDomainAdministrator() {
      // set the first user as domain administrator
      var domain = deployment.models.domain;

      if (deployment.models.users.length === 0) {
        return q();
      }

      domain.administrators = [{ user_id: deployment.models.users[0]._id }];

      return q.npost(domain, 'save').then(function(domain) {
        deployment.models.domain = domain;
      });
    }

    function createUsers() {
      var domainModule = require('../backend/core/user/domain');

      return q.all(deployment.users.map(function(user) {
        return self.createUser(user);
      }))
      .then(function(users) {
        return q.all(
          users.map(function(user) {
            return q.ninvoke(domainModule, 'joinDomain', user, deployment.models.domain)
              .then(function() {
                return q(user);
              });
          })
        );
      })
      .then(function(users) {
        deployment.models.users = users;

        return q(deployment);
      });
    }

    function createCommunities() {
      deployment.communities = deployment.communities || [];
      deployment.models.communities = deployment.models.communities || [];

      return deployment.communities.reduce(function(sofar, c) {
        return sofar.then(function() {
          return saveCollaboration(Community, deployment.models, c);
        }).then(function(collab) {
          deployment.models.communities.push(collab);
        });
      }, q(true));
    }

    function createProjects() {
      deployment.projects = deployment.projects || [];
      deployment.models.projects = deployment.models.projects || [];

      return deployment.projects.reduce(function(sofar, p) {
        return sofar.then(function() {
          var Project = require('mongoose').model('Project');
          return saveCollaboration(Project, deployment.models, p);
        }).then(function(collab) {
          deployment.models.projects.push(collab);
        });
      }, q(true));
    }

    function setupConfiguration() {
      var defer = q.defer();
      if (!testEnv.serversConfig.elasticsearch) {
        defer.resolve(true);
      } else {
        mixin.elasticsearch.saveTestConfiguration(function(err) {
          if (err) {
            return defer.reject(err);
          }
          return defer.resolve(true);
        });
      }
      return defer.promise;
    }

    setupConfiguration()
      .then(createDomain)
      .then(createUsers)
      .then(updateDomainAdministrator)
      .then(createCommunities)
      .then(createProjects)
      .then(function() { return q(deployment.models); })
      .nodeify(callback);
  };

  api.getCommunity = function(id, done) {
    var Community = require('mongoose').model('Community');
    Community.findOne({_id: id}, done);
  };

  api.createCommunity = function(title, creator, domain, opts, done) {
    require(testEnv.basePath + '/backend/core/db/mongo/models/community');
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
  };

  api.addUsersInCommunity = function(community, users, done) {
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
  };

  api.addMembersInCommunity = function(community, tuples, done) {
    var Community = require('mongoose').model('Community');
    var async = require('async');
    async.each(tuples, function(tuple, callback) {
      Community.update({
        _id: community._id || community
      }, {
        $push: {
          members: {
            member: {
              id: tuple.id,
              objectType: tuple.objectType,
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
  };

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
  api.loginAsUser = function(app, email, password, done) {
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
  };

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
  api.applyMultipleTimelineEntries = function(activityStreamUuid, count, verb, callback) {
    require(testEnv.basePath + '/backend/core').db.mongo;
    var mongoose = require('mongoose');
    var async = require('async'),
    TimelineEntry = mongoose.model('TimelineEntry');

    function createTimelineEntry(domain, callback) {
      var e = new TimelineEntry({
        verb: verb,     // "post" or "remove"
        language: 'en',
        actor: {
          objectType: 'user',
          _id: mongoose.Types.ObjectId(),
          image: '123456789',
          displayName: 'foo bar baz'
        },
        object: {
          objectType: 'message',
          _id: mongoose.Types.ObjectId()
        },
        target: [
        {
          objectType: 'activitystream',
          _id: activityStreamUuid
        }
        ]
      });
      e.save(function(err) {
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
  };

  api.applyMultipleTimelineEntriesWithReplies = function(activityStreamUuid, replies, callback) {
    require(testEnv.basePath + '/backend/core').db.mongo;
    var mongoose = require('mongoose');
    var async = require('async'),
      TimelineEntry = mongoose.model('TimelineEntry');

    var inReplyToMessageId = mongoose.Types.ObjectId();

    function createTimelineEntry(callback) {
      var timelineEntry = {
        verb: 'post',
        language: 'en',
        actor: {
          objectType: 'user',
          _id: mongoose.Types.ObjectId(),
          image: '123456789',
          displayName: 'foo bar baz'
        },
        object: {
          objectType: 'message',
          _id: mongoose.Types.ObjectId()
        },
        target: [
          {
            objectType: 'activitystream',
            _id: activityStreamUuid
          }
        ],
        inReplyTo: [{objectType: 'whatsup', _id: inReplyToMessageId}]
      };

      if (replies > 0) {
        timelineEntry.inReplyTo = [{objectType: 'whatsup', _id: inReplyToMessageId}];
      }

      var e = new TimelineEntry(timelineEntry);
      e.save(function(err) {
        if (err) { return callback(err); }
        return callback(null, e);
      });
    }

    function createTimelineEntryJob(callback) {
      createTimelineEntry(callback);
    }

    var arrayJobs = [];

    for (var i = 0; i < replies; i++) {
      arrayJobs.push(createTimelineEntryJob);
    }

    var models = {};
    models.activityStreamUuid = activityStreamUuid;
    models.inReplyToMessageId = inReplyToMessageId;

    async.parallel(arrayJobs, function(err, timelineEntries) {
      if (err) {
        return callback(err);
      }
      models.timelineEntries = timelineEntries;
      return callback(null, models);
    });
  };

  api.recordNextTimelineEntry = function(entry, verb, callback) {
    require(testEnv.basePath + '/backend/core').db.mongo;
    var mongoose = require('mongoose');
    var TimelineEntry = mongoose.model('TimelineEntry');
    entry = entry.toJSON();
    var e = new TimelineEntry({
      verb: verb,
      language: 'en',
      actor: entry.actor,
      object: entry.object,
      target: entry.target
    });
    e.save(callback);
  };

  api.createMessage = function(type, content, author, activitystreams, callback) {
    var module = require(testEnv.basePath + '/backend/core/message');

    var message = {
      content: content,
      objectType: type,
      author: author,
      shares: activitystreams.map(function(stream) {
        return {
          objectType: 'activitystream',
          id: stream
        };
      })
    };
    return module.getInstance(type, message).save(callback);
  };

  api.loadMessage = function(id, callback) {
    var module = require(testEnv.basePath + '/backend/core/message');
    return module.get(id, callback);
  };

  api.requireLogin = function(app, method, apiUrl, done) {
    request(app)[method](apiUrl)
      .expect(401, done);
  };
};
