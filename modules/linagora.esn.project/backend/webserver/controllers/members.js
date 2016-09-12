'use strict';

var async = require('async');

var DEFAULT_LIMIT = 50;
var DEFAULT_OFFSET = 0;

module.exports = function(lib, deps) {

  var controllers = {};

  controllers.add = function(req, res) {
    if (!req.project) {
      return res.status(400).json({error: {code: 400, message: 'Bad request', details: 'Project is required'}});
    }

    if (!req.body.id || !req.body.objectType) {
      return res.status(400).json({error: {code: 400, message: 'Bad request', details: 'Member is malformed'}});
    }

    lib.addMember(req.project, req.user, req.body, function(err, update) {
      if (err) {
        return res.status(500).json({error: {code: 500, message: 'Server Error', details: err.message}});
      }
      return res.status(201).json(update);
    });
  };

  controllers.getInvitable = function(req, res) {
    var communityModule = deps('community');

    var project = req.project;
    if (!project) {
      return res.status(400).json({error: {code: 400, message: 'Bad Request', details: 'Project is missing'}});
    }

    var query = {
      limit: req.query.limit || DEFAULT_LIMIT,
      offset: req.query.offset || DEFAULT_OFFSET,
      search: req.query.search || null
    };

    var domains = [];
    if (req.domain) {
      domains.push(req.domain);
    }

    function communityIsInProject(community, callback) {
      lib.isMember(project, {objectType: 'community', id: community._id}, function(err, isMember) {
        return callback(isMember);
      });
    }

    communityModule.search.find(domains, query, function(err, result) {
      if (err) {
        return res.status(500).json({ error: { code: 500, message: 'Server error', details: 'Error while searching communities: ' + err.message}});
      }

      if (!result || !result.list || result.list.length === 0) {
        res.header('X-ESN-Items-Count', 0);
        return res.status(200).json([]);
      }

      async.filter(result.list, function(community, callback) {
        communityIsInProject(community, function(member) {
          return callback(null, !member);
        });
      }, function(err, results) {
        results = results.map(function(result) {
          return {
            id: result._id,
            objectType: 'community',
            target: result
          };
        });
        res.header('X-ESN-Items-Count', results.length);
        return res.status(200).json(results);
      });
    });
  };
  return controllers;
};
