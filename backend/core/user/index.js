const util = require('util');
const _ = require('lodash');
const esnConfig = require('../../core')['esn-config'];
const pubsub = require('../../core/pubsub').local;
const logger = require('../logger');
const authToken = require('../auth/token');
const mongoose = require('mongoose');
const trim = require('trim');
const User = mongoose.model('User');
const emailAddresses = require('email-addresses');
const CONSTANTS = require('./constants');
const moderation = require('./moderation');
const coreAvailability = require('../availability');
const { getDisplayName } = require('./utils');
const { getOptions } = require('./listener');
const { reindexRegistry } = require('../elasticsearch');

const { TYPE, ELASTICSEARCH } = CONSTANTS;

module.exports = {
  checkEmailsAvailability,
  getDisplayName,
  TYPE,
  recordUser,
  provisionUser,
  translate,
  findByEmail,
  findUsersByEmail,
  get,
  list,
  listByCursor,
  update,
  updateProfile,
  updateStates,
  removeAccountById,
  belongsToCompany,
  getCompanies,
  getNewToken,
  find,
  init,
  moderation,
  provision: require('./provision'),
  domain: require('./domain'),
  follow: require('./follow'),
  login: require('./login'),
  denormalize: require('./denormalize'),
  states: require('./states')
};

function getUserTemplate(callback) {
  esnConfig('user').get(callback);
}

function recordUser(userData, callback) {
  const userAsModel = userData instanceof User ? userData : new User(userData);

  checkEmailsAvailability(userAsModel.emails).then(unavailableEmails => {
    if (unavailableEmails.length > 0) {
      return callback(new Error(`Emails already in use: ${unavailableEmails.join(', ')}`));
    }

    userAsModel.save((err, resp) => {
      if (!err) {
        pubsub.topic(CONSTANTS.EVENTS.userCreated).publish(resp);
        logger.info('User provisioned in datastore:', userAsModel.emails.join(','));
      } else {
        logger.warn('Error while trying to provision user in database:', err.message);
      }
      callback(err, resp);
    });
  }, callback);
}

function provisionUser(data, callback) {
  getUserTemplate((err, template) => {
    if (err) {
      return callback(err);
    }

    recordUser({...template, ...data}, callback);
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
      $or: email.map(item => ({
        accounts: {
          $elemMatch: {
            emails: trim(item).toLowerCase()
          }
        }
      }))
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

function listByCursor() {
  return User.find().cursor();
}

function update(user, callback) {
  user.save((err, savedUser) => {
    if (!err) {
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

  User.findOneAndUpdate({ _id: id }, { $set: profile || {} }, { new: true }, (err, user) => {
    if (!err) {
      pubsub.topic(CONSTANTS.EVENTS.userUpdated).publish(user);
    }
    callback(err, user);
  });
}

function removeAccountById(user, accountId, callback) {
  let accountIndex = -1;

  user.accounts.forEach((account, index) => {
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
  const hasCompany = user.emails.some(email => {
    const domain = emailAddresses.parseOneAddress(email).domain.toLowerCase();
    const domainWithoutSuffix = domain.split('.')[0].toLowerCase();

    return domain === company.toLowerCase() || domainWithoutSuffix === company.toLowerCase();
  });

  return callback(null, hasCompany);
}

function getCompanies(user, callback) {
  if (!user) {
    return callback(new Error('User is required.'));
  }
  const companies = user.emails.map(email => {
    const parsedEmail = emailAddresses.parseOneAddress(email);

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
  coreAvailability.email.addChecker({
    name: 'user',
    check(email) {
      return new Promise((resolve, reject) => {
        findByEmail(email, (err, user) => {
          if (err) return reject(err);

          return resolve(!user);
        });
      });
    }
  });

  // Register elasticsearch reindex options for users
  reindexRegistry.register(ELASTICSEARCH.type, {
    name: ELASTICSEARCH.index,
    buildReindexOptionsFunction: _buildElasticsearchReindexOptions
  });
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

function checkEmailsAvailability(emails) {
  return Promise.all(
    emails.map(email =>
      coreAvailability.email.isAvailable(email)
        .then(result => ({ email, available: result.available }))
  ))
  .then(results =>
    results.filter(result => !result.available).map(result => result.email)
  );
}

function updateStates(userId, states, callback) {
  if (!userId || !states) {
    return callback(new Error('User id and states are required'));
  }

  User.findOneAndUpdate({ _id: userId }, { $set: { states } }, { new: true }, (err, user) => {
    if (!err) {
      pubsub.topic(CONSTANTS.EVENTS.userUpdated).publish(user);
    }

    callback(err);
  });
}

function _buildElasticsearchReindexOptions() {
  const options = getOptions();
  const cursor = listByCursor();

  options.name = ELASTICSEARCH.index;
  options.next = () => cursor.next();

  return Promise.resolve(options);
}
