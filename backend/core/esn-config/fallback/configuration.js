'use strict';

const q = require('q');
const _ = require('lodash');
const confModule = require('../../configuration');

/**
 * Find configuration by domain ID then convert to plain object to be manipulated by esn-config
 * @param  {String|ObjectId} domainId The domain ID
 * @return {Promise}
 */
function findByDomainId(domainId) {
  return q.ninvoke(confModule, 'findByDomainId', domainId).then(_.method('toObject'));
}

module.exports = {
  findByDomainId
};
