const PRIORITY = 100;
const { PeopleSearcher } = require('../../people');
const { OBJECT_TYPE } = require('../constants');
const { search } = require('../search');
const { filterDomainsByMembersCanBeSearched } = require('../../domain/helpers');
const denormalizer = require('./denormalizer');

module.exports = new PeopleSearcher(OBJECT_TYPE, searcher, denormalizer, PRIORITY);

function searcher({ term, context, pagination, excludes }) {
  return new Promise((resolve, reject) => {
    filterDomainsByMembersCanBeSearched([context.domain])
      .then(domains => {
        if (!domains.length) {
          return resolve([]);
        }

        search({ search: term, domains, limit: pagination.limit, excludeUserIds: excludes.map(tuple => tuple.id).filter(Boolean) }, (err, result) => {
          if (err) {
            return reject(err);
          }

          result && result.list ? resolve(result.list) : resolve([]);
        });
      });
  });
}
