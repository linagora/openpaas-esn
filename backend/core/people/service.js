const Q = require('q');
const { LIMIT, OFFSET } = require('./constants');
const PeopleSearcher = require('./searcher');

class PeopleService {
  constructor() {
    this.searchers = new Map();
  }

  /**
   * Do a search among defined query.objectTypes for people matching the query.term string.
   * It is up to each searcher to deal with the term matching.
   * Note: If no objectTypes is defined or if empty, search in ALL searchers.
   */
  search(query = { objectTypes: [], term: '', context: {}, pagination: { limit: LIMIT, offset: OFFSET }, excludes: [] }) {
    query.pagination = { ...{ limit: LIMIT, offset: OFFSET }, ...query.pagination };
    query.excludes = query.excludes || [];
    const localSearchers = ((!query.objectTypes || !query.objectTypes.length) ?
      [...this.searchers.values()] :
      query.objectTypes.map(objectType => this.searchers.get(objectType)).filter(Boolean))
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    return Q.allSettled(localSearchers.map(searcher => search(searcher, query)))
      .then(allPromises => allPromises.filter(promise => promise.state === 'fulfilled').map(promise => promise.value))
      .then(fulFilled => fulFilled.filter(Boolean))
      .then(people => [].concat(...people));

    function search(searcher, { term, context, pagination, excludes }) {
      return searcher.search({ term, context, pagination, excludes: excludes.filter(tuple => tuple.objectType === searcher.objectType) })
        .then(results => denormalizeAll(results, searcher, context));
    }

    function denormalizeAll(data, searcher, context) {
      return Promise.all(data.map(source => searcher.denormalize({ source, context })));
    }
  }

  addSearcher(searcher) {
    if (!searcher || !(searcher instanceof PeopleSearcher)) {
      throw new Error('Wrong searcher definition', searcher);
    }
    this.searchers.set(searcher.objectType, searcher);
  }
}

module.exports = PeopleService;
