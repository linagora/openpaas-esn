const Q = require('q');
const { LIMIT } = require('./constants');
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
  search(query = { objectTypes: [], term: '', context: {}, pagination: { limit: LIMIT, offset: 0 }}) {
    const localResolvers = ((!query.objectTypes || !query.objectTypes.length) ?
      [...this.resolvers.values()] :
      query.objectTypes.map(objectType => this.resolvers.get(objectType)).filter(Boolean))
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    return Q.allSettled(localResolvers.map(resolver => resolve(resolver, query)))
      .then(allPromises => allPromises.filter(_ => _.state === 'fulfilled').map(_ => _.value))
      .then(fulFilled => fulFilled.filter(Boolean))
      .then(people => [].concat(...people));

    function resolve(resolver, { term, context, pagination }) {
      return resolver.resolve({ term, context, pagination }).then(results => denormalizeAll(results, resolver));
    }

    function denormalizeAll(data, resolver) {
      return Promise.all(data.map(e => resolver.denormalize(e)));
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
