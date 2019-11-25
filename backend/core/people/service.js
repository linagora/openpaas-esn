const Q = require('q');
const { LIMIT, OFFSET } = require('./constants');
const logger = require('../logger');
const PeopleSearcher = require('./searcher');
const PeopleResolver = require('./resolver');

class PeopleService {
  constructor() {
    this.searchers = new Map();
    this.resolvers = new Map();
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

  /**
   * Resolve a certain value of a field type (e.g email address)
   * Return a resolved object that is having exact match with the given value of the resolving field
   * Resolver priority is decided by the objectTypes list. Resolving process will run sequentialy,
   * only the first resolved result is used
   *
   * Note: If no objectTypes is defined or if empty, registered resolvers are used and ran in default
   * priority order.
   */
  resolve(query = {objectTypes: [], fieldType: '', value: '', context: {}}) {
    let localResolvers;

    if (query.objectTypes && query.objectTypes.length) {
      localResolvers = query.objectTypes
        .map(objectType => this.resolvers.get(objectType))
        .filter(Boolean);
    } else {
      localResolvers = [...this.resolvers.values()]
        .sort((a, b) => (b.defaultPriority || 0) - (a.defaultPriority || 0));
    }

    return localResolvers.reduce((promise, resolver) =>
      promise.then(result => result || resolve(resolver, query)), Promise.resolve());

    function resolve(resolver, { fieldType, value, context }) {
      return resolver.resolve({ fieldType, value, context })
        .then(result => (result && denormalize(result, resolver, context)))
        .catch(error => logger.error(`Failed to resolve ${resolver.objectType}`, error));
    }

    function denormalize(source, resolver, context) {
      return resolver.denormalize({ source, context }).catch(error =>
        logger.error(`Failed to denormalize ${resolver.objectType}`, error));
    }
  }

  addSearcher(searcher) {
    if (!searcher || !(searcher instanceof PeopleSearcher)) {
      throw new Error('Wrong searcher definition', searcher);
    }
    this.searchers.set(searcher.objectType, searcher);
  }

  addResolver(resolver) {
    if (!resolver || !(resolver instanceof PeopleResolver)) {
      throw new Error('Wrong resolver definition', resolver);
    }
    this.resolvers.set(resolver.objectType, resolver);
  }
}

module.exports = PeopleService;
