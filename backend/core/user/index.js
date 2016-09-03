'use strict';

var util = require('util');
var esnConfig = require('../../core')['esn-config'];
var pubsub = require('../../core/pubsub').local;
var logger = require('../logger');
var authToken = require('../auth/token');
var extend = require('extend');
var mongoose = require('mongoose');
var trim = require('trim');
var User = mongoose.model('User');
var emailAddresses = require('email-addresses');
var CONSTANTS = require('./constants');

var TYPE = CONSTANTS.TYPE;
module.exports.TYPE = TYPE;

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

module.exports.recordUser = recordUser;

module.exports.provisionUser = function(data, callback) {
  getUserTemplate(function(err, user) {
    if (err) {
      return callback(err);
    }
    extendUserTemplate(user, data);
    recordUser(user, callback);
  });
};

module.exports.findByEmail = function(email, callback) {
  var query;

  if (util.isArray(email)) {
    query = {
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
    query = {
      accounts: {
        $elemMatch: {
          emails: trim(email).toLowerCase()
        }
      }
    };
  }

  User.findOne(query, callback);
};

module.exports.get = function(uuid, callback) {
  User.findOne({_id: uuid}, callback);
};

module.exports.list = function(callback) {
  User.find(callback);
};

module.exports.updateProfile = function(user, profile, callback) {
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
};

module.exports.checkPassword = function(user, password, callback) {
  user.comparePassword(password, function(err, isMatch) {
    return callback(err || isMatch ? null : new Error('Unmatched password'));
  });
};

module.exports.updatePassword = function(user, password, callback) {
  // OR-128 - Do not use findOneAndUpdate here because mongoose 3.x does not
  // support pre hook on update. We must use pre fook on save to crypt the password
  User.findOne({ _id: user._id || user }, function(err, user) {
    if (err) {
      return callback(err);
    }
    user.password = password;
    user.save(callback);
  });
};

module.exports.removeAccountById = function(user, accountId, callback) {
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
};

module.exports.belongsToCompany = function(user, company, callback) {
  if (!user || !company) {
    return callback(new Error('User and company are required.'));
  }
  var hasCompany = user.emails.some(function(email) {
    var domain = emailAddresses.parseOneAddress(email).domain.toLowerCase();
    var domainWithoutSuffix = domain.split('.')[0].toLowerCase();
    return domain === company.toLowerCase() || domainWithoutSuffix === company.toLowerCase();
  });
  return callback(null, hasCompany);
};

module.exports.getCompanies = function(user, callback) {
  if (!user) {
    return callback(new Error('User is required.'));
  }
  var companies = user.emails.map(function(email) {
    var parsedEmail = emailAddresses.parseOneAddress(email);
    return parsedEmail.domain.split('.')[0];
  });
  return callback(null, companies);
};

function getNewToken(user, ttl, callback) {
  authToken.getNewToken({ttl: ttl, user: user._id, user_type: TYPE}, callback);
}
module.exports.getNewToken = getNewToken;

function find(query, callback) {
  User.findOne(query, callback);
}
module.exports.find = find;

module.exports.domain = require('./domain');

module.exports.follow = require('./follow');

module.exports.login = require('./login');
