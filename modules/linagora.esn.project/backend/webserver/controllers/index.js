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
        return res.json(500, { error: { code: 500, message: 'Project retrieval failed', details: err }});
      }
      if (!project) {
        return res.json(404, { error: { code: 404, message: 'Not found', details: 'Project not found' }});
      }

      transform(lib, project, req.user, function(transformed) {
        res.json(200, transformed);
      });
    });
  };

  controllers.create = function(req, res, next) {
    function copyIfSet(key) {
      if (req.body[key]) {
        project[key] = req.body[key];
      }
    }

    var project = {
      title: req.body.title,
      creator: req.user._id,
      domain_ids: req.body.domain_ids,
      type: 'open',
      members: [
        { member: { id: req.user._id, objectType: 'user' } }
      ]
    };

    ['description', 'startDate', 'endDate',
     'status', 'avatar'].forEach(copyIfSet);

    var startDate = new Date(project.startDate);
    var endDate = new Date(project.endDate);
    if (project.startDate && isNaN(startDate)) {
      return res.status(400).json({ error: { code: 400, message: 'Bad request', details: 'Start date is invalid'}});
    } else if (project.endDate && isNaN(endDate)) {
      return res.status(400).json({ error: { code: 400, message: 'Bad request', details: 'End date is invalid'}});
    }
    if (project.startDate && project.endDate && startDate.getTime() > endDate.getTime()) {
      return res.status(400).json({ error: { code: 400, message: 'Bad request', details: 'Start date is after end date'}});
    }

    if (!project.domain_ids || project.domain_ids.length === 0) {
      return res.status(400).json({ error: { code: 400, message: 'Bad request', details: 'At least a domain is required'}});
    }

    lib.create(project, function(err, project) {
      if (err) {
        res.status(400).json({ error: { code: 400, message: 'Project creation failed', details: err.message }});
      } else {
        res.status(201).json(project);
      }
    });
  };

  return controllers;
}

module.exports = projectControllers;
