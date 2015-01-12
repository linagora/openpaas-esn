'use strict';

var collaborationModule = require('../../core/collaboration/index');
var Member = require('../../helpers/collaboration').Member;
var permission = require('../../core/collaboration/permission');

var async = require('async');

function transform(collaboration, user, callback) {
  if (!collaboration) {
    return callback({});
  }

  if (typeof(collaboration.toObject) === 'function') {
    collaboration = collaboration.toObject();
  }

  collaboration.members_count = collaboration.members ? collaboration.members.length : 0;
  delete collaboration.members;
  delete collaboration.membershipRequests;
  return callback(collaboration);
}

module.exports.searchWhereMember = function(req, res) {

  if (!req.query.objectType || !req.query.id) {
    return res.json(400, {error: {code: 400, message: 'Bad request', details: 'objectType and id query parameters are required'}});
  }

  collaborationModule.getCollaborationsForTuple({objectType: req.query.objectType, id: req.query.id}, function(err, collaborations) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server error', details: err.message}});
    }

    var tuple = {objectType: 'user', id: req.user._id};
    async.filter(collaborations, function(collaboration, callback) {

      if (permission.isPubliclyReadable(collaboration)) {
        return callback(true);
      }

      collaborationModule.isMember(collaboration, tuple, function(err, member) {
        if (err) {
          return callback(false);
        }
        return callback(member);
      });
    }, function(results) {
      async.map(results, function(element, callback) {
        transform(element, req.user, function(transformed) {
          transformed.objectType = req.query.objectType;
          return callback(null, transformed);
        });
      }, function(err, results) {
        if (err) {
          return res.json(500, {error: {code: 500, message: 'Server error', details: err.message}});
        }
        return res.json(200, results);
      });
    });
  });
};

function getMembers(req, res) {
  if (!req.collaboration) {
    return res.json(500, {error: {code: 500, message: 'Server error', details: 'Collaboration is mandatory here'}});
  }

  var query = {};
  if (req.query.limit) {
    var limit = parseInt(req.query.limit, 10);
    if (!isNaN(limit)) {
      query.limit = limit;
    }
  }

  if (req.query.offset) {
    var offset = parseInt(req.query.offset, 10);
    if (!isNaN(offset)) {
      query.offset = offset;
    }
  }

  collaborationModule.getMembers(req.collaboration, req.params.objectType, query, function(err, members) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.message}});
    }

    res.header('X-ESN-Items-Count', req.collaboration.members ? req.collaboration.members.length : 0);

    function format(member) {
      var result = Object.create(null);
      if (!member || !member.member) {
        return result;
      }

      result.user = new Member(member);

      result.metadata = {
        timestamps: member.timestamps
      };

      return result;
    }

    var result = members.map(function(member) {
      return format(member);
    });

    return res.json(200, result || []);
  });
}
module.exports.getMembers = getMembers;
