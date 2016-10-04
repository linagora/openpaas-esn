'use strict';

var q = require('q');
var request = require('request');
var ObjectId = require('mongoose').Types.ObjectId;

module.exports = function(dependencies) {

  var userModule = dependencies('user');
  var domainModule = dependencies('domain');
  var logger = dependencies('logger');
  var storeModule = dependencies('store');

  function createUserFromProfile(profile, user) {
    var profileToUser;
    try {
      profileToUser = require('./' + profile.provider).profileToUser;
    } catch (err) {
      profileToUser = function(profile, user) {
        return user;
      };
    }
    return q(profileToUser(profile, user));
  }

  function fetchAvatar(user, uri) {
    var defer = q.defer();

    request.head(uri, function(err, res) {
      if (err) {
        return defer.reject(err);
      }

      var avatarId = new ObjectId();
      storeModule.store(avatarId, res.headers['content-type'], {creator: user._id}, request.get(uri), {}, function(err) {
        if (err) {
          return defer.reject(err);
        }
        defer.resolve(avatarId);
      });

    });
    return defer.promise;
  }

  function updateAvatar(user, avatarId) {
    user.avatars = user.avatars || [];
    user.avatars.push(avatarId);
    user.currentAvatar = avatarId;
    return q.denodeify(userModule.recordUser)(user).catch(function(err) {
      logger.warn('Error while saving avatar', err);
      return user;
    });
  }

  function setAvatar(user, avatarURL) {
    if (!avatarURL) {
      return q(user);
    }

    return fetchAvatar(user, avatarURL).then(function(id) {
      return updateAvatar(user, id);
    }, function(err) {
      logger.warn('Can not get user avatar from provider', err);
      return user;
    });
  }

  function getDomain() {
    return q.denodeify(domainModule.list)({})
      .then(function(domains) {
        if (!domains || domains.length === 0) {
          return q.reject(new Error('Can not find any domain'));
        }
        return domains[0];
      });
  }

  function provision(profile, account) {

    var user = {
      emails: [profile.emails[0].value],
      accounts: [account]
    };

    function provisionUser(userToProvision) {
      return getDomain().then(function(domain) {
        user.domains = [{domain_id: domain._id}];
        return q.denodeify(userModule.provisionUser)(userToProvision).then(function(created) {
          return {
            user: created,
            userToProvision: userToProvision
          };
        });
      });
    }

    return createUserFromProfile(profile, user)
      .then(provisionUser)
      .then(function(provisioned) {
        return setAvatar(provisioned.user, provisioned.userToProvision.avatarURL);
      });
  }

  return {
    provision: provision
  };
};
