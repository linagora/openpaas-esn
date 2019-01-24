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
    let localResolvers;

    if (!query.objectTypes || !query.objectTypes.length) {
      localResolvers = [...this.resolvers.values()];
    } else {
      localResolvers = query.objectTypes.map(objectType => this.resolvers.get(objectType)).filter(Boolean);
    }

    return Q.allSettled(localResolvers.map(resolver => resolve(resolver, query)))
      .then(allPromises => allPromises.filter(_ => _.state === 'fulfilled').map(_ => _.value))
      .then(fulFilled => fulFilled.filter(Boolean))
      .then(promises => [].concat(...promises));

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
