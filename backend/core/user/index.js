'use strict';

const util = require('util');
const _ = require('lodash');
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
  User.findOne(buildFindByEmailQuery(email), callback);
}

function findUsersByEmail(email, callback) {
  User.find(buildFindByEmailQuery(email), callback);
}

function buildFindByEmailQuery(email) {
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
  }

  return {
    accounts: {
      $elemMatch: {
        emails: trim(email).toLowerCase()
      }
    }
  };
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

/**
 * Translate external payload to OpenPaaS user. This is used by provision modules,
 * such as converting LDAP user to OpenPaaS user
 *
 * @param  {Object} baseUser    The base user object to be extended
 * @param  {Object} payload     The payload used to convert to OP user
 * @return {Object}             The OpenPaaS user object
 */
function translate(baseUser, payload) {
  const userEmail = payload.username; // we use email as username to authenticate
  const domainId = payload.domainId;
  const payloadUser = payload.user;
  const mapping = payload.mapping;
  const outputUser = baseUser || {};

  // provision domain
  if (!outputUser.domains) {
    outputUser.domains = [];
  }

  if (domainId) {
    const domain = _.find(outputUser.domains, domain => String(domain.domain_id) === String(domainId));

    if (!domain) {
      outputUser.domains.push({ domain_id: domainId });
    }
  }

  // provision email account
  if (!outputUser.accounts) {
    outputUser.accounts = [];
  }

  let emailAccount = _.find(outputUser.accounts, { type: 'email' });

  if (!emailAccount) {
    emailAccount = {
      type: 'email',
      hosted: true,
      emails: []
    };
    outputUser.accounts.push(emailAccount);
  }

  if (emailAccount.emails.indexOf(userEmail) === -1) {
    emailAccount.emails.push(userEmail);
  }

  // provision other fields basing on mapping
  _.forEach(mapping, (value, key) => {
    if (key === 'email') {
      const email = payloadUser[value];

      if (emailAccount.emails.indexOf(email) === -1) {
        emailAccount.emails.push(email);
      }
    } else {
      outputUser[key] = payloadUser[value];
    }
  });

  return outputUser;
}

function getDisplayName(user) {
  return user.firstname && user.lastname ? `${user.firstname} ${user.lastname}` : user.preferredEmail;
}

module.exports = {
  getDisplayName,
  TYPE: TYPE,
  recordUser: recordUser,
  provisionUser: provisionUser,
  translate,
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
