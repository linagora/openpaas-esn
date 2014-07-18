'use strict';

var mongoose = require('mongoose');
var Community = mongoose.model('Community');
var logger = require('../logger');
var domainModule = require('../domain');
var async = require('async');

module.exports.updateAvatar = function(community, avatar, callback) {
  if (!community) {
    return callback(new Error('Community is required'));
  }
  if (!avatar) {
    return callback(new Error('Avatar ID is required'));
  }

  community.avatar = avatar;
  var communityModel = community instanceof Community ? community : new Community(community);
  communityModel.save(callback);
};

module.exports.save = function(community, callback) {
  if (!community) {
    return callback(new Error('Can not save null community'));
  }

  if (!community.title) {
    return callback(new Error('Can not save community with null title'));
  }

  if (!community.domain_ids || community.domain_ids.length === 0) {
    return callback(new Error('Can not save community without at least a domain'));
  }

  Community.testTitleDomain(community.title, community.domain_ids, function(err, result) {
    if (err) {
      return callback(new Error('Unable to lookup title/domain: ' + community.title + '/' + community.domain_id + ' : ' + err));
    }
    if (result) {
      return callback(new Error('Title/domain: ' + community.title + '/' + community.domain_id + ' already exist.'));
    }

    var com = new Community(community);
    com.save(function(err, response) {
      if (!err) {
        logger.info('Added new community:', { _id: response._id });
      } else {
        logger.info('Error while trying to add a new community:', err.message);
      }
      return callback(err, response);
    });
  });
};

module.exports.load = function(community, callback) {
  if (!community) {
    return callback(new Error('Community is required'));
  }

  var id = community._id || community;
  return Community.findOne({_id: id}, callback);
};

module.exports.loadWithDomains = function(community, callback) {
  if (!community) {
    return callback(new Error('Community is required'));
  }
  var id = community._id || community;
  return Community.findOne({_id: id}).populate('domain_ids', null, 'Domain').exec(callback);
};

module.exports.query = function(query, callback) {
  query = query || {};
  return Community.find(query, callback);
};

module.exports.delete = function(community, callback) {
  if (!community) {
    return callback(new Error('Community is required'));
  }
  return callback(new Error('Not implemented'));
};

module.exports.userIsCommunityMember = function(user, community, callback) {
  if (!user || !user._id) {
    return callback(new Error('User object is required'));
  }

  if (!community || !community._id) {
    return callback(new Error('Community object is required'));
  }

  if (!community.domain_ids ||community.domain_ids.length === 0) {
    return callback(new Error('Community does not belong to any domain'));
  }

  var userInDomain = function(domain_id, callback) {
    domainModule.load(domain_id, function(err, domain) {
      if (err) {
        return callback(false);
      }
      domainModule.userIsDomainMember(user, domain, function(err, isMember) {
        if (err) {
          return callback(false);
        }
        return callback(isMember);
      });
    });
  };

  async.some(community.domain_ids, userInDomain, function(result) {
    return callback(null, result);
  });
};
