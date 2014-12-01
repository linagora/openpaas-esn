'use strict';
var async = require('async');
var escapeStringRegexp = require('escape-string-regexp');

function transform(lib, project, user, callback) {
  if (!project) {
    return {};
  }

  var membershipRequest = lib.getMembershipRequest(project, user);

  if (typeof(project.toObject) === 'function') {
    project = project.toObject();
  }

  project.members_count = project.members ? project.members.length : 0;
  if (membershipRequest) {
    project.membershipRequest = membershipRequest.timestamp.creation.getTime();
  }

  lib.isMember(project, user._id, function(err, membership) {
    if (membership) {
      project.member_status = 'member';
    } else {
      project.member_status = 'none';
    }
    delete project.members;
    delete project.membershipRequests;
    return callback(project);
  });
}

function projectControllers(lib, dependencies) {
  var controllers = {};

  controllers.getAll = function(req, res, next) {
    var query = {};
    if (req.domain) {
      query.domain_ids = [req.domain._id];
    }

    if (req.param('creator')) {
      query.creator = req.param('creator');
    }

    if (req.param('title')) {
      var escapedString = escapeStringRegexp(req.param('title'));
      query.title = new RegExp('^' + escapedString + '$', 'i');
    }

    lib.query(query, function(err, response) {
      if (err) {
        return res.json(500, { error: { code: 500, message: 'Project list failed', details: err}});
      }

      async.map(response, function(project, callback) {
        transform(lib, project, req.user, function(transformed) {
          return callback(null, transformed);
        });
      }, function(err, results) {
        return res.json(200, results);
      });
    });
  };

  controllers.get = function(req, res, next) {
    var query = { _id: req.params.id };

    lib.queryOne(query, function(err, project) {
      if (err) {
        return res.json(500, { error: { status: 500, message: 'Project retrieval failed', details: err }});
      }
      if (!project) {
        return res.json(404, { error: { status: 404, message: 'Not found', details: 'Project not found' }});
      }

      transform(lib, project, req.user, function(transformed) {
        res.json(200, transformed);
      });
    });
  };

  controllers.create = function(req, res, next) {
    lib.create(req.body, function(err, project) {
      if (err) {
        res.json(400, { error: { status: 400, message: 'Project creation failed', details: err.message }});
      } else {
        res.json(201, project);
      }
    });
  };

  return controllers;
}

module.exports = projectControllers;
