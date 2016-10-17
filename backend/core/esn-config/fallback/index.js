'use strict';

const q = require('q');
const _ = require('lodash');
const confModule = require('./configuration');
const mongoconfig = require('./mongoconfig');
const features = require('./features');

/**
 * Get documents from three collections then merge to one to provide fallback
 * compatibility
 *
 * It also gets system-wide configuration to provide system-wide fallback when
 * the domain-wide configuration is not available.
 *
 * @param  {String|ObjectId} domainId The domain ID
 * @return {Promise}
 */
function findByDomainId(domainId) {
  return q.allSettled([
    mongoconfig.findByDomainId(domainId),
    domainId ? features.findByDomainId(null) : q.reject(),
    features.findByDomainId(domainId),
    domainId ? confModule.findByDomainId(null) : q.reject(),
    confModule.findByDomainId(domainId)
  ])
  .then(function(data) {
    var fulFilledDocuments = data.map(function(doc) {
      return doc.state === 'fulfilled' ? doc.value : null;
    }).filter(Boolean);

    if (fulFilledDocuments.length === 0) {
      return q.reject(data[0].reason);
    }

    var mergedDoc = Object.create(null);

    fulFilledDocuments.forEach(function(doc) {
      mergeDocument(mergedDoc, doc);
    });

    return mergedDoc;
  });

}

function mergeDocument(targetDoc, sourceDoc) {
  if (!targetDoc.modules) {
    targetDoc.modules = [];
  }

  if (sourceDoc.modules) {
    sourceDoc.modules.forEach(function(sourceModule) {
      var targetModule = _.find(targetDoc.modules, { name: sourceModule.name });

      if (targetModule) {
        sourceModule.configurations.forEach(function(config) {
          _.remove(targetModule.configurations, { name: config.name });
          targetModule.configurations.push(config);
        });
      } else {
        targetDoc.modules.push(sourceModule);
      }
    });
  }
}

module.exports = {
  findByDomainId
};
