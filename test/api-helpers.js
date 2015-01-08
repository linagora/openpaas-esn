'use strict';

var extend = require('extend');
var q = require('q');

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

    async.parallel(userJobs, function(err) {
      models.domain.remove(function() {
        callback();
      });
    });

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
    if (! (name in fixtures)) {
      return callback(new Error('Unknown fixture name ' + name));
    }
    var deployment = fixtures[name]();
    require(testEnv.basePath + '/backend/core').db.mongo;

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
          return;
        }
        collaboration.members.push({member: {objectType: 'community', id: community[0]._id}});
      }
    };

    function mapCollaborationUsers(models, c) {
      var d = q.defer();
      var collaboration = extend(true, {}, c);
      var creator = models.users.filter(function(u) { return u.emails.indexOf(collaboration.creator) >= 0; });
      if (!creator.length) {
        d.reject(new Error('Creator ', collaboration.creator, 'cannot be found in domain users'));
        return d.promise;
      }
      collaboration.creator = creator[0]._id;
      collaboration.domain_ids = [models.domain._id];
      collaboration.members = [{member: {objectType: 'user', id: creator[0]._id}}];
      c.members.forEach(function(m) {
        try {
          fillCollaboration[m.objectType](models, collaboration, m);
        } catch (err) {
          console.log(err);
        }
      });
      d.resolve(collaboration);
      return d.promise;
    }

    function saveCollaboration(Model, data) {
      var d = q.defer();
      var model = new Model(data);
      model.save(function(err, c) {
        if (err) {
          d.reject(err);
        } else {
          d.resolve(c);
        }
      });
      return d.promise;
    }

    function createDomain(deployment) {
      var d = q.defer();
      var Domain = require('mongoose').model('Domain');
      var domain = new Domain(deployment.domain);
      domain.save(function(err, domain) {
        if (err) {
          d.reject(err);
        } else {
          deployment.models.domain = domain;
          d.resolve(deployment);
        }
      });
      return d.promise;
    }

    function createUsers(deployment) {
      var User = require('mongoose').model('User');
      return q.all(deployment.users.map(function(user) {
        var u = new User(user);
        var d = q.defer();
        u.save(function(err, u) {
          if (err) {
            d.reject(err);
          } else {
            d.resolve(u);
          }
        });
        return d.promise;
      }))
      .then(function(users) {
        return q.all(
          users.map(function(u) {
            return q.ninvoke(u, 'joinDomain', deployment.models.domain)
            .then(function() {
              return q(u);
            });
          })
        );
      })
      .then(function(users) {
        deployment.models.users = users;
        return q(deployment);
      });
    }

    function createCommunities(deployment) {
      deployment.communities = deployment.communities ||  [];

      return q.all(deployment.communities.map(function(c) {
        return mapCollaborationUsers(deployment.models, c);
      }))
      .then(function(communities) {
        return q.all(communities.map(function(community) {
          var Community = require('mongoose').model('Community');
          return saveCollaboration(Community, community);
        }));
      })
      .then(function(communities) {
        deployment.models.communities = communities;
        return q(deployment);
      });
    }

    function createProjects(deployment) {
      deployment.projects = deployment.projects ||  [];

      return q.all(deployment.projects.map(function(c) {
        return mapCollaborationUsers(deployment.models, c);
      }))
      .then(function(projects) {
        return q.all(projects.map(function(project) {
          var Project = require('mongoose').model('Project');
          return saveCollaboration(Project, project);
        }));
      })
      .then(function(projects) {
        deployment.models.projects = projects;
        return q(deployment);
      });
    }

    createDomain(deployment)
    .then(createUsers)
    .then(createCommunities)
    .then(createProjects)
    .then(function(deployment) {
      return q(deployment.models);
    })
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

  api.createConference = function(creator, attendees, done) {
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
  };
};
