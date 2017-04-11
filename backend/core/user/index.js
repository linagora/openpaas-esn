'use strict';

const util = require('util');
const esnConfig = require('../../core')['esn-config'];
const pubsub = require('../../core/pubsub').local;
const logger = require('../logger');
const authToken = require('../auth/token');
const extend = require('extend');
const mongoose = require('mongoose');
const trim = require('trim');
const User = mongoose.model('User');
const emailAddresses = require('email-addresses');
const CONSTANTS = require('./constants');
const moderation = require('./moderation');

const TYPE = CONSTANTS.TYPE;

function getUserTemplate(callback) {
  esnConfig('user').get(callback);
}

function extendUserTemplate(template, data) {
  extend(template, data);
}

function recordUser(userData, callback) {
  var userAsModel = userData instanceof User ? userData : new User(userData);
  userAsModel.save(function(err, resp) {
    if (!err) {
      pubsub.topic(CONSTANTS.EVENTS.userCreated).publish(resp);
      logger.info('User provisioned in datastore:', userAsModel.emails.join(','));
    } else {
      logger.warn('Error while trying to provision user in database:', err.message);
    }
    callback(err, resp);
  });
}

function provisionUser(data, callback) {
  getUserTemplate(function(err, user) {
    if (err) {
      return callback(err);
    }
    extendUserTemplate(user, data);
    recordUser(user, callback);
  });
}

function findByEmail(email, callback) {
  const query = findByEmailQuery(email);

  User.findOne(query, callback);
}

function findUsersByEmail(email, callback) {
  const query = findByEmailQuery(email);

  User.find(query, callback);
}

function findByEmailQuery(email) {
  if (util.isArray(email)) {
    return {
      $or: email.map(function(e) {
        return {
          accounts: {
            $elemMatch: {
              emails: trim(e).toLowerCase()
            }
          }
        };
      })
    };
  } else {
    return {
      accounts: {
        $elemMatch: {
          emails: trim(email).toLowerCase()
        }
      }
    };
  }
}

function get(uuid, callback) {
  User.findOne({_id: uuid}, callback);
}

function list(callback) {
  User.find(callback);
}

function update(user, callback) {
  user.save((err, savedUser, rowAffected) => {
    if (!err && rowAffected > 0) {
      pubsub.topic(CONSTANTS.EVENTS.userUpdated).publish(savedUser);
    }

    callback(err, savedUser);
  });
}

function updateProfile(user, profile, callback) {
  if (!user || !profile) {
    return callback(new Error('User and profile are required'));
  }

  var id = user._id || user;

  User.findOneAndUpdate({ _id: id }, { $set: profile || {} }, { new: true }, function(err, user) {
    if (!err) {
      pubsub.topic(CONSTANTS.EVENTS.userUpdated).publish(user);
    }
    callback(err, user);
  });
}

function removeAccountById(user, accountId, callback) {
  var accountIndex = -1;
  user.accounts.forEach(function(account, index) {
    if (account.data && account.data.id === accountId) {
      accountIndex = index;
    }

    if (index === user.accounts.length - 1) {
      if (accountIndex === -1) {
        return callback(new Error('Invalid account id: ' + accountId));
      } else {
        user.accounts.splice(accountIndex, 1);
        user.markModified('accounts');
        return user.save(callback);
      }
    }
  });
}

function belongsToCompany(user, company, callback) {
  if (!user || !company) {
    return callback(new Error('User and company are required.'));
  }
  var hasCompany = user.emails.some(function(email) {
    var domain = emailAddresses.parseOneAddress(email).domain.toLowerCase();
    var domainWithoutSuffix = domain.split('.')[0].toLowerCase();
    return domain === company.toLowerCase() || domainWithoutSuffix === company.toLowerCase();
  });
  return callback(null, hasCompany);
}

function getCompanies(user, callback) {
  if (!user) {
    return callback(new Error('User is required.'));
  }
  var companies = user.emails.map(function(email) {
    var parsedEmail = emailAddresses.parseOneAddress(email);
    return parsedEmail.domain.split('.')[0];
  });
  return callback(null, companies);
}

function getNewToken(user, ttl, callback) {
  authToken.getNewToken({ttl: ttl, user: user._id, user_type: TYPE}, callback);
}

function find(query, callback) {
  User.findOne(query, callback);
}

function init() {
  moderation.init();
}

module.exports = {
  TYPE: TYPE,
  recordUser: recordUser,
  provisionUser: provisionUser,
  findByEmail: findByEmail,
  findUsersByEmail: findUsersByEmail,
  get: get,
  list: list,
  update: update,
  updateProfile: updateProfile,
  removeAccountById: removeAccountById,
  belongsToCompany: belongsToCompany,
  getCompanies: getCompanies,
  getNewToken: getNewToken,
  find: find,
  init: init,
  moderation: moderation,
  domain: require('./domain'),
  follow: require('./follow'),
  login: require('./login')
};
