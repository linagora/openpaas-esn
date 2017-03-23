'use strict';

const q = require('q');
const _ = require('lodash');
const confModule = require('../../configuration');

module.exports = {
  findConfigurationForDomain,
  findConfigurationForUser
};

/**
 * Find configuration for domain then convert to plain object to be manipulated by esn-config
 * @param  {String|ObjectId} domainId The domain ID
 * @return {Promise}
 */
 function findConfigurationForDomain(domainId) {
   return q.ninvoke(confModule, 'findConfiguration', domainId).then(_.method('toObject'));
 }

 /**
  * Find configuration for user then convert to plain object to be manipulated by esn-config
  * @param  {String|ObjectId} domainId The domain ID
  * @param  {String|ObjectId} userId The user ID
  * @return {Promise}
  */
 function findConfigurationForUser(domainId, userId) {
   return q.ninvoke(confModule, 'findConfiguration', domainId, userId).then(_.method('toObject'));
 }
