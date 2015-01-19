'use strict';

var async = require('async');
var userModule = require('../core/user');
var userHelpers = require('./user');

function checkUserCompanyWithUserObject(arrayOfCompanyTuple, user, callback) {
  userHelpers.isInternal(user, function(err, isInternal) {
    if (err) {
      return callback(err);
    }
    // If the user is internal he can read
    if (isInternal) {
      return callback(null, true);
    }
    // If the user is external he can read only if his company is in "to" field
    // If the "to" field is not an array or is empty the external user can not read
    if (!Array.isArray(arrayOfCompanyTuple) || arrayOfCompanyTuple.length === 0) {
      return callback(null, false);
    }
    // Check if a company match with the user company
    async.some(arrayOfCompanyTuple, function(tuple, userCompanyMatchTupleCompany) {
      if (tuple.objectType === 'company') {
        userModule.belongsToCompany(user, tuple.id, function(err, belongsToCompany) {
          return userCompanyMatchTupleCompany(err ? false : belongsToCompany);
        });
      } else {
        return userCompanyMatchTupleCompany(false);
      }
    }, function(canRead) {
      return callback(null, canRead);
    });
  });
}

/**
 * Check if the user company is in the array of company tuple.
 * If the user parameter is not an object then it will be loaded from the database.
 *
 * @param {object[]} arrayOfCompanyTuple the array of company tuple
 * @param {object|String} user the user to check
 * @param {function} callback fn like callback(err, result)
 */
function checkUserCompany(arrayOfCompanyTuple, user, callback) {
  if (!user) {
    return callback(new Error('User is required'));
  }

  if (user.domains) {
    return checkUserCompanyWithUserObject(arrayOfCompanyTuple, user, callback);
  } else {
    userModule.get(user, function(err, userLoaded) {
      if (err) {
        return callback(err);
      }
      if (!userLoaded) {
        return callback(new Error('User with id "' + user + '" not found'));
      }
      return checkUserCompanyWithUserObject(arrayOfCompanyTuple, userLoaded, callback);
    });
  }
}
module.exports.checkUserCompany = checkUserCompany;
