const extend = require('extend');
const { promisify } = require('util');
const request = require('supertest');
const async = require('async');

module.exports = function(mixin, testEnv) {
  const api = {};

  mixin.api = api;
  api.getStreamData = function(stream, callback) {
    const data = [];

    stream.on('data', function(chunk) {
      data.push(chunk);
    });
    stream.on('end', function() {
      callback(data.join(''));
    });
  };

  api.cleanDomainDeployment = function(models, callback) {
    require(testEnv.basePath + '/backend/core').db.mongo;

    const userJobs = models.users.map(function(user) {
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
    const User = require('mongoose').model('User');
    const userHelper = require('../backend/core/user/helpers');

    return promisify(userHelper.saveAndIndexUser)(new User(user));
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
    const fixturesPath = options.fixtures ? options.fixtures : testEnv.fixtures + '/deployments';
    const fixtures = require(fixturesPath);

    if (!(name in fixtures)) {
      return callback(new Error('Unknown fixture name ' + name));
    }
    const deployment = fixtures[name]();

    require(testEnv.basePath + '/backend/core').db.mongo;
    const self = this;

    require('mongoose').model('User');
    const Community = require('mongoose').model('Community');
    const Domain = require('mongoose').model('Domain');
    const helpers = require('../backend/core/db/mongo/plugins/helpers');

    helpers.applyCommunityPlugins();
    helpers.patchFindOneAndUpdate();

    deployment.models = {};

    const fillCollaboration = {
      user: function(models, collaboration, member) {
        if (member.objectType !== 'user') {
          return;
        }

        const users = models.users.filter(function(user) { return user.emails.indexOf(member.id) >= 0; });

        if (!users.length) {
          return;
        }
        collaboration.members.push({member: {objectType: 'user', id: users[0]._id}});
      },

      community: function(models, collaboration, member) {
        if (member.objectType !== 'community') {
          return;
        }
        const communities = models.communities.filter(function(community) {
          return community.title.indexOf(member.id) >= 0;
        });

        if (!communities.length) {
          throw new Error('Could not find ' + member.id);
        }
        collaboration.members.push({member: {objectType: 'community', id: communities[0]._id}});
      }
    };

    function saveCollaboration(Model, models, collaboration) {
      const collaborationToSave = extend(true, {}, collaboration);
      const creator = models.users.filter(function(user) { return user.emails.indexOf(collaborationToSave.creator) >= 0; });

      if (!creator.length) {
        return Promise.reject(new Error('Creator ', collaborationToSave.creator, 'cannot be found in domain users'));
      }
      collaborationToSave.creator = creator[0]._id;
      collaborationToSave.domain_ids = [models.domain._id];
      collaborationToSave.members = [{member: {objectType: 'user', id: creator[0]._id}}];
      try {
        collaboration.members.forEach(function(member) {
          fillCollaboration[member.objectType](models, collaborationToSave, member);
        });
      } catch (err) {
        return Promise.reject(err);
      }

      const collaborationInstance = new Model(collaborationToSave);

      return collaborationInstance.save();
    }

    function createDomain() {
      const domain = extend(true, {}, deployment.domain);

      delete domain.administrators;

      const domainInstance = new Domain(domain);

      return domainInstance.save().then(function(domain) {
        deployment.models.domain = domain;
      });
    }

    function updateDomainAdministrator() {
      // set the first user as domain administrator
      const domain = deployment.models.domain;

      if (deployment.models.users.length === 0) {
        return Promise.resolve();
      }

      domain.administrators = [{ user_id: deployment.models.users[0]._id }];

      return domain.save().then(function(domain) {
        deployment.models.domain = domain;
      });
    }

    function createUsers() {
      const domainModule = require('../backend/core/user/domain');

      return Promise.all(deployment.users.map(function(user) {
        return self.createUser(user);
      }))
      .then(function(users) {
        return Promise.all(
          users.map(function(user) {
            return promisify(domainModule.joinDomain)(user, deployment.models.domain)
              .then(function() {
                return Promise.resolve(user);
              });
          })
        );
      })
      .then(function(users) {
        deployment.models.users = users;

        return Promise.resolve(deployment);
      });
    }

    function createCommunities() {
      deployment.communities = deployment.communities || [];
      deployment.models.communities = deployment.models.communities || [];

      return deployment.communities.reduce(function(sofar, community) {
        return sofar.then(function() {
          return saveCollaboration(Community, deployment.models, community);
        }).then(function(collab) {
          deployment.models.communities.push(collab);
        });
      }, Promise.resolve(true));
    }

    function setupConfiguration() {
      if (!testEnv.serversConfig.elasticsearch) {
        return Promise.resolve(true);
      }

      return promisify(mixin.elasticsearch.saveTestConfiguration)()
        .then(() => true);
    }

    setupConfiguration()
      .then(createDomain)
      .then(createUsers)
      .then(updateDomainAdministrator)
      .then(createCommunities)
      .then(() => callback(null, deployment.models))
      .catch(callback);
  };

  api.getCommunity = function(id, done) {
    const Community = require('mongoose').model('Community');

    Community.findOne({_id: id}, done);
  };

  api.createCommunity = function(title, creator, domain, opts, done) {
    require(testEnv.basePath + '/backend/core/db/mongo/models/community');
    if (opts && !done) {
      done = opts;
      opts = null;
    }
    const Community = require('mongoose').model('Community');
    const creatorId = creator._id || creator;
    let json = {
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
    const community = new Community(json);

    return community.save(done);
  };

  api.addUsersInCommunity = function(community, users, done) {
    const Community = require('mongoose').model('Community');

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
    const Community = require('mongoose').model('Community');

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
    const request = require('supertest');

    request(app)
    .post('/api/login')
    .send({username: email, password: password, rememberme: false})
    .expect(200)
    .end(function(err, res) {
      if (err) {
        return done(err);
      }
      const cookies = res.headers['set-cookie'].pop().split(';').shift();

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
    const mongoose = require('mongoose');
    const TimelineEntry = mongoose.model('TimelineEntry');

    function createTimelineEntry(domain, callback) {
      const timelineEntry = new TimelineEntry({
        verb: verb, // "post" or "remove"
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

      timelineEntry.save(function(err) {
        if (err) { return callback(err); }

        return callback(null, timelineEntry);
      });
    }

    function createTimelineEntryJob(callback) {
      createTimelineEntry(activityStreamUuid, callback);
    }

    const arrayJobs = [];

    for (let i = 0; i < count; i++) {
      arrayJobs.push(createTimelineEntryJob);
    }

    const models = {};

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
    const mongoose = require('mongoose');
    const TimelineEntry = mongoose.model('TimelineEntry');

    const inReplyToMessageId = mongoose.Types.ObjectId();

    function createTimelineEntry(callback) {
      const timelineEntry = {
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

      const e = new TimelineEntry(timelineEntry);

      e.save(function(err) {
        if (err) { return callback(err); }

        return callback(null, e);
      });
    }

    function createTimelineEntryJob(callback) {
      createTimelineEntry(callback);
    }

    const arrayJobs = [];

    for (let i = 0; i < replies; i++) {
      arrayJobs.push(createTimelineEntryJob);
    }

    const models = {};

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
    const mongoose = require('mongoose');
    const TimelineEntry = mongoose.model('TimelineEntry');

    entry = entry.toJSON();

    const timelineEntry = new TimelineEntry({
      verb: verb,
      language: 'en',
      actor: entry.actor,
      object: entry.object,
      target: entry.target
    });

    timelineEntry.save(callback);
  };

  api.createMessage = function(type, content, author, activitystreams, callback) {
    const module = require(testEnv.basePath + '/backend/core/message');
    const message = {
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
    const module = require(testEnv.basePath + '/backend/core/message');

    return module.get(id, callback);
  };

  api.requireLogin = function(app, method, apiUrl, done) {
    request(app)[method](apiUrl)
      .expect(401, done);
  };
};
