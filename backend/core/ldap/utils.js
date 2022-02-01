const _ = require('lodash');

module.exports = {
  aggregate,
  buildSearchFilter,
  getUniqueAttr,
  sanitizeInput
};

function buildSearchFilter(mapping, search) {
  let searchFilter = '';

  search = search ? `*${sanitizeInput(search)}*` : '*';

  _.forEach(mapping, function(ldapAttr) {
    searchFilter += `(${ldapAttr}=${search})`;
  });

  searchFilter = `(|${searchFilter})`;

  return searchFilter;
}

function getUniqueAttr(ldapSearchFilter) {
  const matches = ldapSearchFilter.match(/\((.*)=\{\{username\}\}\)/);

  return matches ? matches[1] : null;
}

function aggregate(sources, limit) {
  const destinations = [];
  let numberOfItemsToCollect = limit;

  for (let round = 0; numberOfItemsToCollect > 0; round++) {
    const items = collect(sources, round, numberOfItemsToCollect);
    const collectedElement = items.length;

    if (collectedElement > 0) {
      numberOfItemsToCollect -= collectedElement;
      Array.prototype.push.apply(destinations, items);
    } else {
      break;
    }
  }

  return destinations;

  function collect(sources, round, limit) {
    const items = [];
    let collectedElement = 0;

    for (let i = 0; i < sources.length && collectedElement < limit; i++) {
      const source = sources[i];

      if (round < source.length) {
        items.push(source[round]);
        collectedElement += 1;
      }
    }

    return items;
  }
}

/**
 * Sanitize LDAP special characters from input
 *
 * {@link https://tools.ietf.org/search/rfc4515#section-3}
 *
 * @param {string} input - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeInput(input) {
  return input
    .replace(/\*/g, '\\2a')
    .replace(/\(/g, '\\28')
    .replace(/\)/g, '\\29')
    .replace(/\\/g, '\\5c')
    .replace(/\0/g, '\\00')
    .replace(/\//g, '\\2f');
}
