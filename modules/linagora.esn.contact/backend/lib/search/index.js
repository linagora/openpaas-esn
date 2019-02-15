const {
  NOTIFICATIONS,
  SEARCH
} = require('../constants');

module.exports = dependencies => {
  const logger = dependencies('logger');
  const elasticsearch = dependencies('elasticsearch');
  const pubsub = dependencies('pubsub');
  const listener = require('./listener')(dependencies);
  const { buildReindexOptions } = require('./reindex')(dependencies);
  let searchHandler;

  return {
    init,
    searchContacts,
    indexContact,
    removeContactFromIndex,
    removeContactsOfAddressbook
  };

  function indexContact(contact, callback) {
    logger.debug('Indexing contact into elasticseach', contact);

    if (!searchHandler) {
      return callback(new Error('Contact search is not initialized'));
    }

    if (!contact) {
      return callback(new Error('Contact is required'));
    }
    searchHandler.indexData(contact, callback);
  }

  function removeContactFromIndex(contact, callback) {
    logger.info('Removing contact from index', contact);

    if (!searchHandler) {
      return callback(new Error('Contact search is not initialized'));
    }

    if (!contact) {
      return callback(new Error('Contact is required'));
    }
    searchHandler.removeFromIndex(contact, callback);
  }

  function removeContactsOfAddressbook(addressbook, callback) {
    logger.info('Removing all contacts of addressbook from Elasticsearch', addressbook);

    const elasticsearchQuery = {
      query: {
        bool: {
          must: [
            { match: { userId: addressbook.userId } },
            { match: { bookId: addressbook.bookId } },
            { match: { bookName: addressbook.bookName } }
          ]
        }
      }
    };

    elasticsearch.removeDocumentsByQuery({
      index: SEARCH.INDEX_NAME,
      type: SEARCH.TYPE_NAME,
      body: elasticsearchQuery
    }, callback);
  }

  function searchContacts(query, callback) {
    const terms = query.search;
    const page = query.page || 1;
    let offset = query.offset;
    const limit = query.limit || SEARCH.DEFAULT_LIMIT;
    const addressbooks = query.addressbooks;
    const excludeIds = query.excludeIds;
    const filters = [];

    if (!addressbooks || addressbooks.length === 0) {
      return callback(null, {
        current_page: 1,
        total_count: 0,
        list: []
      });
    }

    addressbooks.forEach(addressbook => {
      filters.push(
        {
          bool: {
            must: [
              { match: { bookId: addressbook.bookHome } },
              { match: { bookName: addressbook.bookName } }
            ]
          }
        }
      );
    });

    var elasticsearchQuery = {
      query: {
        bool: {
          must: {
            multi_match: {
              query: terms,
              type: 'cross_fields',
              fields: ['firstName^1000',
                'lastName^1000',
                'nickname^1000',
                'org^100',
                'tel.value^100',
                'tags.text^100',
                'comments^100',
                'emails.value^100',
                'socialprofiles.value^100',
                'job^10',
                'birthday',
                'urls.value',
                'addresses.full'],
              operator: 'and',
              tie_breaker: 0.5
            }
          }
        }
      }
    };

    if (Array.isArray(excludeIds) && excludeIds.length) {
      elasticsearchQuery.query.bool.must_not = {
        terms: {
          _id: query.excludeIds
        }
      };
    }

    if (filters.length) {
      elasticsearchQuery.query.bool.filter = {
        bool: {
          should: filters
        }
      };
    }

    if (!offset) {
      offset = (page - 1) * limit;
    }

    elasticsearch.searchDocuments({
      index: SEARCH.INDEX_NAME,
      type: SEARCH.TYPE_NAME,
      from: offset,
      size: limit,
      body: elasticsearchQuery
    }, function(err, result) {
      if (err) {
        return callback(err);
      }
      return callback(null, {
        current_page: page,
        total_count: result.hits.total,
        list: result.hits.hits
      });
    });
  }

  function init() {
    listen();

    // Register elasticsearch reindex options for contacts
    elasticsearch.reindexRegistry.register(SEARCH.TYPE_NAME, {
      name: SEARCH.INDEX_NAME,
      buildReindexOptionsFunction: buildReindexOptions
    });
  }

  function listen() {
    logger.info('Subscribing to contact updates for indexing');

    pubsub.local.topic(NOTIFICATIONS.ADDRESSBOOK_DELETED).subscribe(data => {
      removeContactsOfAddressbook(data, error => {
        if (error) {
          logger.error('Error while removing contacts from Elasticsearch', error);
        }
      });
    });

    searchHandler = listener.register();
  }
};
