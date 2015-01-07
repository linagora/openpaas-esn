'use strict';

var collaborationModule = require('../../core/collaboration/index');
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

}
module.exports.getMembers = getMembers;
