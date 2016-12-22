'use strict';

const _ = require('lodash');

function buildSearchFilter(mapping, search) {
  let searchFilter = '';

  search = search ? `*${search}*` : '*';

  _.forEach(mapping, function(ldapAttr, userAttr) {
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

module.exports = {
  aggregate,
  buildSearchFilter,
  getUniqueAttr
};
