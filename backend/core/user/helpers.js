'use strict';

var userListener = require('./listener');
var elasticSearch = require('../elasticsearch/listeners');
var logger = require('../logger');

/**
 * Calls user#save and index it in elastic search. Note that this function may only be used by in certain contexts like
 * test setup since users are already indexed thanks to the index framework.
 * @param user
 * @param callback
 */
function saveAndIndexUser(user, callback) {
  user.save(function(err, result) {

    if (err) {
      return callback(err);
    }

    elasticSearch.index(result, userListener.getOptions(), function(indexErr, indexResult) {
      if (indexErr) {
        logger.error('Error while indexing data', indexErr);
      }

      if (indexResult) {
        logger.debug('Data indexed', indexResult);
      }

      callback(err, result);
    });
  });
}
module.exports.saveAndIndexUser = saveAndIndexUser;
