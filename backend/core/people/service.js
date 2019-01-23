const PeopleResolver = require('./resolver');
const logger = require('../logger');

class PeopleService {
  constructor() {
    this.resolvers = new Map();
  }

  /**
   * Do a search among defined query.objectTypes for people matching the query.term string.
   * It is up to each resolver to deal with the term matching.
   * Note: If no objectTypes is defined or if empty, search in ALL resolvers.
   */
  search(query = { objectTypes: [], term: '', context: {}}) {
    let localResolvers;

    if (!query.objectTypes || !query.objectTypes.length) {
      localResolvers = [...this.resolvers.values()];
    } else {
      localResolvers = query.objectTypes.map(objectType => this.resolvers.get(objectType)).filter(Boolean);
    }

    return Promise.all(localResolvers.map(resolver => resolve(resolver, query)))
      .then(people => [].concat(...people))
      .catch(err => {
        logger.error('Error while resolving people', err);

        throw err;
      });

    function resolve(resolver, { term, context }) {
      return resolver.resolve({term, context}).then(results => denormalizeAll(results, resolver));
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
