const Q = require('q');
const { LIMIT, OFFSET } = require('./constants');
const PeopleResolver = require('./resolver');

class PeopleService {
  constructor() {
    this.resolvers = new Map();
  }

  /**
   * Do a search among defined query.objectTypes for people matching the query.term string.
   * It is up to each resolver to deal with the term matching.
   * Note: If no objectTypes is defined or if empty, search in ALL resolvers.
   */
  search(query = { objectTypes: [], term: '', context: {}, pagination: { limit: LIMIT, offset: OFFSET }, excludes: [] }) {
    query.pagination = { ...{ limit: LIMIT, offset: OFFSET }, ...query.pagination };
    query.excludes = query.excludes || [];
    const localResolvers = ((!query.objectTypes || !query.objectTypes.length) ?
      [...this.resolvers.values()] :
      query.objectTypes.map(objectType => this.resolvers.get(objectType)).filter(Boolean))
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    return Q.allSettled(localResolvers.map(resolver => resolve(resolver, query)))
      .then(allPromises => allPromises.filter(promise => promise.state === 'fulfilled').map(promise => promise.value))
      .then(fulFilled => fulFilled.filter(Boolean))
      .then(people => [].concat(...people));

    function resolve(resolver, { term, context, pagination, excludes }) {
      return resolver.resolve({ term, context, pagination, excludes: excludes.filter(tuple => tuple.objectType === resolver.objectType) })
        .then(results => denormalizeAll(results, resolver, context));
    }

    function denormalizeAll(data, resolver, context) {
      return Promise.all(data.map(source => resolver.denormalize({ source, context })));
    }
  }

  addResolver(resolver) {
    if (!resolver || !(resolver instanceof PeopleResolver)) {
      throw new Error('Wrong resolver definition', resolver);
    }
    this.resolvers.set(resolver.objectType, resolver);
  }
}

module.exports = PeopleService;
